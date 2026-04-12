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
  }),
  // 커스텀 게임: 질문 내용을 서버에 스냅샷으로 저장
  z.object({
    isCustom: z.literal(true),
    customQuestions: z.array(
      z.object({ text: z.string().min(1), optionA: z.string().min(1), optionB: z.string().min(1) })
    ).min(1).max(20),
    answers: z.array(AnswerSchema).min(1),
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
router.post('/:shortCode/answers', async (req, res) => {
  const parsed = z.object({ answers: z.array(AnswerSchema).min(1) }).safeParse(req.body);
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
      data: { bAnswers: parsed.data.answers as unknown as Prisma.InputJsonValue, status: 'COMPLETE' },
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

    res.json({
      ready: true,
      isCustom: room.isCustom,
      matchPercent,
      grade: getGrade(matchPercent),
      matchCount,
      totalCount: questionIds.length,
      details,
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

function getGrade(percent: number) {
  if (percent >= 90) return { label: '영혼의 쌍둥이', description: '말 안 해도 통하는 사이' };
  if (percent >= 70) return { label: '환장의 짝꿍', description: '서로를 잘 아는 케미 폭발 사이' };
  if (percent >= 40) return { label: '철저한 비즈니스 관계', description: '다르지만 함께라면 성장하는 사이' };
  return { label: '어떻게 친해진 거지?', description: '정반대지만 그래서 더 재밌는 사이' };
}

export default router;
