import { Router } from 'express';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import { Prisma } from '@prisma/client';
import { AnswerItem, QuestionSnapshot } from '../types';
import prisma from '../prisma';

const router = Router();

function generateShortCode(): string {
  return randomBytes(3).toString('hex').toUpperCase();
}

const AnswerSchema = z.object({
  questionId: z.string(),
  choice: z.enum(['A', 'B']),
});

const CreateRoomSchema = z.discriminatedUnion('isCustom', [
  // 일반 게임: FE가 로컬 데이터에서 랜덤 선택한 questionIds 저장
  z.object({
    isCustom: z.literal(false),
    topicId: z.string(),
    questionIds: z.array(z.string()).min(1).max(20),
    answers: z.array(AnswerSchema).min(1),
    userKey: z.string().optional(),
  }),
  // 커스텀 게임: 질문 내용을 서버에 스냅샷으로 저장
  z.object({
    isCustom: z.literal(true),
    customQuestions: z.array(
      z.object({ text: z.string().min(1), optionA: z.string().min(1), optionB: z.string().min(1) })
    ).min(1).max(20),
    answers: z.array(AnswerSchema).min(1),
    userKey: z.string().optional(),
  }),
]);

// POST /api/rooms — A유저 답변 완료 후 방 생성
router.post('/', async (req, res) => {
  const parsed = CreateRoomSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  try {
    let shortCode: string;
    let attempts = 0;
    do {
      shortCode = generateShortCode();
      if (++attempts > 10) throw new Error('Failed to generate unique short code');
    } while (await prisma.room.findUnique({ where: { shortCode } }));

    const data = parsed.data;

    let roomData;
    if (!data.isCustom) {
      // 일반 게임: questionIds 배열과 answers 유효성 검사
      const answerIds = new Set(data.answers.map(a => a.questionId));
      const missingAnswers = data.questionIds.filter(id => !answerIds.has(id));
      if (missingAnswers.length > 0) {
        res.status(400).json({ error: 'Missing answers for some questions' });
        return;
      }

      roomData = {
        shortCode,
        topicId: data.topicId,
        isCustom: false,
        questionIds: data.questionIds as unknown as Prisma.InputJsonValue,
        questionsSnapshot: Prisma.JsonNull,
        aAnswers: data.answers as unknown as Prisma.InputJsonValue,
        creatorUserKey: data.userKey ?? null,
      };
    } else {
      // 커스텀 게임: 질문에 ID 부여 후 스냅샷 저장
      const questionsSnapshot: QuestionSnapshot[] = data.customQuestions.map((q, i) => ({
        id: `custom-${i + 1}`,
        text: q.text,
        optionA: q.optionA,
        optionB: q.optionB,
        order: i + 1,
      }));

      const answerIds = new Set(data.answers.map(a => a.questionId));
      const missing = questionsSnapshot.filter(q => !answerIds.has(q.id));
      if (missing.length > 0) {
        res.status(400).json({ error: 'Missing answers for some questions' });
        return;
      }

      roomData = {
        shortCode,
        topicId: null,
        isCustom: true,
        questionIds: Prisma.JsonNull,
        questionsSnapshot: questionsSnapshot as unknown as Prisma.InputJsonValue,
        aAnswers: data.answers as unknown as Prisma.InputJsonValue,
        creatorUserKey: data.userKey ?? null,
      };
    }

    const room = await prisma.room.create({
      data: {
        ...roomData,
        status: 'WAITING_B',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.status(201).json({ roomId: room.id, shortCode: room.shortCode });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/rooms/my?userKey=xxx — 내가 보낸/받은 초대 목록
router.get('/my', async (req, res) => {
  const userKey = req.query.userKey as string | undefined;
  if (!userKey) { res.status(400).json({ error: 'userKey is required' }); return; }

  const select = {
    shortCode: true, topicId: true, isCustom: true,
    status: true, createdAt: true, expiresAt: true,
  };

  try {
    const [sentRooms, receivedRooms] = await Promise.all([
      prisma.room.findMany({ where: { creatorUserKey: userKey }, orderBy: { createdAt: 'desc' }, select: { ...select, bUserKey: true } }),
      prisma.room.findMany({ where: { bUserKey: userKey }, orderBy: { createdAt: 'desc' }, select: { ...select, creatorUserKey: true } }),
    ]);

    // 상대방 이름 일괄 조회
    const otherKeys = [
      ...sentRooms.map(r => r.bUserKey).filter(Boolean) as string[],
      ...receivedRooms.map(r => r.creatorUserKey).filter(Boolean) as string[],
    ];
    const users = otherKeys.length
      ? await prisma.user.findMany({ where: { userKey: { in: otherKeys } }, select: { userKey: true, name: true } })
      : [];
    const nameMap = new Map(users.map(u => [u.userKey, u.name]));

    const sent = sentRooms.map(({ bUserKey: bk, ...r }) => ({ ...r, otherName: bk ? (nameMap.get(bk) ?? null) : null }));
    const received = receivedRooms.map(({ creatorUserKey: ck, ...r }) => ({ ...r, otherName: ck ? (nameMap.get(ck) ?? null) : null }));

    res.json({ sent, received });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/rooms/:shortCode?userKey=xxx — 내 방 삭제
router.delete('/:shortCode', async (req, res) => {
  const userKey = req.query.userKey as string | undefined;
  if (!userKey) { res.status(400).json({ error: 'userKey is required' }); return; }

  try {
    const room = await prisma.room.findUnique({ where: { shortCode: req.params.shortCode } });
    if (!room) { res.status(404).json({ error: 'Room not found' }); return; }
    if (room.creatorUserKey !== userKey) { res.status(403).json({ error: 'Not authorized' }); return; }

    await prisma.room.delete({ where: { shortCode: req.params.shortCode } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/rooms/:shortCode — B유저 진입 시 방 정보 조회
router.get('/:shortCode', async (req, res) => {
  try {
    const room = await prisma.room.findUnique({
      where: { shortCode: req.params.shortCode },
    });

    if (!room) { res.status(404).json({ error: 'Room not found' }); return; }
    if (new Date() > room.expiresAt) { res.status(410).json({ error: 'Room has expired' }); return; }

    res.json({
      roomId: room.id,
      shortCode: room.shortCode,
      topicId: room.topicId,
      isCustom: room.isCustom,
      // 일반 게임: FE가 로컬 데이터 룩업에 사용할 ID 배열
      questionIds: room.isCustom ? null : (room.questionIds as string[]),
      // 커스텀 게임: 질문 내용 포함
      questionsSnapshot: room.isCustom ? (room.questionsSnapshot as unknown as QuestionSnapshot[]) : null,
      status: room.status,
      aCompleted: room.aAnswers !== null,
      bCompleted: room.bAnswers !== null,
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/rooms/:shortCode/answers — B유저 답변 제출
router.get('/:shortCode/status', async (req, res) => {
  try {
    const room = await prisma.room.findUnique({
      where: { shortCode: req.params.shortCode },
      select: { shortCode: true, status: true, expiresAt: true },
    });

    if (!room) { res.status(404).json({ error: 'Room not found' }); return; }

    const expired = new Date() > room.expiresAt;
    if (expired) {
      res.status(410).json({
        shortCode: room.shortCode,
        status: room.status,
        expired: true,
      });
      return;
    }

    res.set('Cache-Control', 'private, max-age=2, stale-while-revalidate=8');
    res.json({
      shortCode: room.shortCode,
      status: room.status,
      expired: false,
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:shortCode/answers', async (req, res) => {
  const parsed = z.object({
    answers: z.array(AnswerSchema).min(1),
    userKey: z.string().optional(),
  }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }

  try {
    const room = await prisma.room.findUnique({ where: { shortCode: req.params.shortCode } });
    if (!room) { res.status(404).json({ error: 'Room not found' }); return; }
    if (new Date() > room.expiresAt) { res.status(410).json({ error: 'Room has expired' }); return; }
    if (room.bAnswers !== null) { res.status(409).json({ error: 'B already submitted answers' }); return; }

    // 제출된 questionIds와 방에 저장된 IDs 일치 여부 확인
    const expectedIds: string[] = room.isCustom
      ? (room.questionsSnapshot as unknown as QuestionSnapshot[]).map(q => q.id)
      : (room.questionIds as unknown as string[]);

    const answerIds = new Set(parsed.data.answers.map(a => a.questionId));
    const missing = expectedIds.filter(id => !answerIds.has(id));
    if (missing.length > 0) {
      res.status(400).json({ error: 'Missing answers for some questions' });
      return;
    }

    await prisma.room.update({
      where: { shortCode: req.params.shortCode },
      data: {
        bAnswers: parsed.data.answers as unknown as Prisma.InputJsonValue,
        bUserKey: parsed.data.userKey ?? null,
        status: 'COMPLETE',
      },
    });

    res.json({ success: true, bothComplete: true });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/rooms/:shortCode/result
router.get('/:shortCode/result', async (req, res) => {
  try {
    const room = await prisma.room.findUnique({ where: { shortCode: req.params.shortCode } });
    if (!room) { res.status(404).json({ error: 'Room not found' }); return; }

    if (room.status !== 'COMPLETE' || !room.aAnswers || !room.bAnswers) {
      res.status(202).json({ ready: false, message: 'Waiting for both players to complete' });
      return;
    }

    const aAnswers = room.aAnswers as unknown as AnswerItem[];
    const bAnswers = room.bAnswers as unknown as AnswerItem[];
    const aMap = new Map(aAnswers.map(a => [a.questionId, a.choice]));
    const bMap = new Map(bAnswers.map(a => [a.questionId, a.choice]));

    const questionIds: string[] = room.isCustom
      ? (room.questionsSnapshot as unknown as QuestionSnapshot[]).map(q => q.id)
      : (room.questionIds as unknown as string[]);

    let matchCount = 0;
    const details = questionIds.map(qId => {
      const aChoice = aMap.get(qId) ?? null;
      const bChoice = bMap.get(qId) ?? null;
      const isMatch = aChoice !== null && bChoice !== null && aChoice === bChoice;
      if (isMatch) matchCount++;

      // 커스텀 게임은 서버가 질문 텍스트 포함, 일반 게임은 FE가 로컬에서 보강
      const snapshot = room.isCustom
        ? (room.questionsSnapshot as unknown as QuestionSnapshot[]).find(q => q.id === qId)
        : null;

      return {
        questionId: qId,
        // 커스텀 게임 전용 텍스트 (일반 게임은 null → FE 로컬 데이터 사용)
        text: snapshot?.text ?? null,
        optionA: snapshot?.optionA ?? null,
        optionB: snapshot?.optionB ?? null,
        aChoice,
        bChoice,
        isMatch,
      };
    });

    const matchPercent = Math.round((matchCount / questionIds.length) * 100);

    // 참여자 이름 조회
    const userKeys = [room.creatorUserKey, room.bUserKey].filter(Boolean) as string[];
    const users = userKeys.length
      ? await prisma.user.findMany({ where: { userKey: { in: userKeys } }, select: { userKey: true, name: true } })
      : [];
    const nameMap = new Map(users.map(u => [u.userKey, u.name]));

    res.json({
      ready: true,
      isCustom: room.isCustom,
      matchPercent,
      grade: getGrade(matchPercent),
      matchCount,
      totalCount: questionIds.length,
      aName: room.creatorUserKey ? (nameMap.get(room.creatorUserKey) ?? null) : null,
      bName: room.bUserKey ? (nameMap.get(room.bUserKey) ?? null) : null,
      details,
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

function getGrade(percent: number) {
  if (percent >= 96) return { label: '완벽한 짝꿍', description: '말 안 해도 통하는 사이' };
  if (percent >= 91) return { label: '영혼의 단짝', description: '서로를 누구보다 잘 아는 사이' };
  if (percent >= 86) return { label: '최고의 콤비', description: '함께라면 무엇이든 척척' };
  if (percent >= 81) return { label: '마음이 통하는 사이', description: '생각이 비슷해서 편안한 사이' };
  if (percent >= 76) return { label: '잘 통하는 친구', description: '자주 의견이 맞는 사이' };
  if (percent >= 71) return { label: '믿음직한 동반자', description: '서로 믿고 의지할 수 있는 사이' };
  if (percent >= 66) return { label: '좋은 관계', description: '함께 있으면 즐거운 사이' };
  if (percent >= 61) return { label: '괜찮은 사이', description: '어느 정도 마음이 맞는 사이' };
  if (percent >= 56) return { label: '편안한 관계', description: '특별히 불편한 점 없는 사이' };
  if (percent >= 51) return { label: '그럭저럭 잘 맞는 사이', description: '차이가 있지만 이해하는 사이' };
  if (percent >= 46) return { label: '반반 사이', description: '맞는 부분과 다른 부분이 공존하는 사이' };
  if (percent >= 41) return { label: '평범한 관계', description: '조금씩 다른 부분이 있는 사이' };
  if (percent >= 36) return { label: '차이가 느껴지는 사이', description: '다르지만 함께라면 성장하는 사이' };
  if (percent >= 31) return { label: '다른 점이 많은 사이', description: '서로 다름을 배워가는 사이' };
  if (percent >= 26) return { label: '타입이 꽤 다른 사이', description: '의견이 자주 엇갈리는 사이' };
  if (percent >= 21) return { label: '많이 다른 사이', description: '생각 차이가 꽤 크지만 재밌는 사이' };
  if (percent >= 16) return { label: '반대 스타일', description: '정반대에 가깝지만 그게 매력인 사이' };
  if (percent >= 11) return { label: '극과 극의 사이', description: '이 정도면 신기하게 잘 지내는 사이' };
  if (percent >= 6)  return { label: '완전히 다른 세계', description: '어떻게 친해진 건지 신기한 사이' };
  return { label: '우주 반대편', description: '정반대지만 그래서 더 재밌는 사이' };
}

export default router;
