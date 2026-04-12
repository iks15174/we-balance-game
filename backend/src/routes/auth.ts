import { Router } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { generateAccessToken, getLoginMe } from '../services/tossLoginService';

const router = Router();

const LoginSchema = z.object({
  authorizationCode: z.string(),
  referrer: z.string(),
});

// POST /api/auth/login
// FE에서 appLogin() 완료 후 authorizationCode/referrer를 전달
router.post('/login', async (req, res) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: '잘못된 요청 형식입니다.' });
    return;
  }

  try {
    const { authorizationCode, referrer } = parsed.data;
    const { accessToken } = await generateAccessToken(authorizationCode, referrer);
    const { userKey, name } = await getLoginMe(accessToken);

    await prisma.user.upsert({
      where: { userKey },
      create: { userKey, name },
      update: { name },   // 이름이 바뀌는 경우를 대비해 매번 갱신
    });

    res.json({ userKey, name });
  } catch (err) {
    console.error('로그인 오류:', err);
    res.status(500).json({ error: '로그인에 실패했어요.' });
  }
});

// GET /api/auth/me?userKey=xxx
// localStorage에 저장된 userKey가 여전히 유효한지 확인 (탈퇴 후 무효화)
router.get('/me', async (req, res) => {
  const { userKey } = req.query as { userKey?: string };
  if (!userKey) {
    res.status(400).json({ error: 'userKey가 필요합니다.' });
    return;
  }

  try {
    const user = await prisma.user.findUnique({ where: { userKey } });
    if (!user) {
      res.status(404).json({ error: '유효하지 않은 유저입니다.' });
      return;
    }
    res.json({ valid: true });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
