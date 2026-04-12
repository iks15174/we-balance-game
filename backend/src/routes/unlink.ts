import { Router } from 'express';
import prisma from '../prisma';

const router = Router();

// POST /api/auth/unlink
// 앱인토스 콘솔에서 유저가 "연결 끊기(탈퇴)" 시 앱인토스가 자동 호출하는 콜백
// Basic Auth: we-balance-game:<AIT_UNLINK_SECRET>
router.post('/unlink', async (req, res) => {
  const expectedAuth = `Basic ${Buffer.from(`we-balance-game:${process.env.AIT_UNLINK_SECRET}`).toString('base64')}`;
  const authHeader = req.headers['authorization'];

  if (authHeader !== expectedAuth) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const body = req.body as { userKey?: string | number };
  const userKey = body?.userKey != null ? String(body.userKey) : undefined;

  if (!userKey) {
    res.status(400).json({ error: 'userKey가 필요합니다.' });
    return;
  }

  try {
    // 해당 유저의 모든 데이터 삭제 (현재는 User 테이블만, 추후 확장 시 추가)
    await prisma.user.deleteMany({ where: { userKey } });

    console.info(`유저 탈퇴 처리 완료: ${userKey.slice(0, 8)}...`);
    res.json({ success: true });
  } catch (err) {
    console.error('탈퇴 처리 오류:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
