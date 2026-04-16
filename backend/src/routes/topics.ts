import { Router } from 'express';
import prisma from '../prisma';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const topics = await prisma.topic.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      select: { id: true, name: true, emoji: true, description: true, imageUrl: true, order: true },
    });
    res.json(topics);
  } catch (_err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:topicId/questions', async (req, res) => {
  try {
    const questions = await prisma.question.findMany({
      where: { topicId: req.params.topicId },
      orderBy: { order: 'asc' },
      select: { id: true, text: true, optionA: true, optionB: true, imageUrl: true, order: true },
    });
    if (!questions.length) {
      res.status(404).json({ error: 'Topic not found or has no questions' });
      return;
    }
    res.json(questions);
  } catch (_err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
