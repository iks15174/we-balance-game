import { Router } from 'express';
import { z } from 'zod';
import { adminAuth } from '../middleware/auth';
import prisma from '../prisma';

const router = Router();

router.use(adminAuth);

// ─── Topics ──────────────────────────────────────────────────────────────────

// GET /api/admin/topics
router.get('/topics', async (_req, res) => {
  try {
    const topics = await prisma.topic.findMany({
      orderBy: { order: 'asc' },
      include: { _count: { select: { questions: true } } },
    });
    res.json(topics);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/topics
const TopicSchema = z.object({
  name: z.string().min(1),
  emoji: z.string().min(1),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  order: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

router.post('/topics', async (req, res) => {
  const parsed = TopicSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
  try {
    const topic = await prisma.topic.create({ data: parsed.data });
    res.status(201).json(topic);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/admin/topics/:id
router.put('/topics/:id', async (req, res) => {
  const parsed = TopicSchema.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
  try {
    const topic = await prisma.topic.update({ where: { id: req.params.id }, data: parsed.data });
    res.json(topic);
  } catch {
    res.status(404).json({ error: 'Topic not found' });
  }
});

// DELETE /api/admin/topics/:id
router.delete('/topics/:id', async (req, res) => {
  try {
    await prisma.topic.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch {
    res.status(404).json({ error: 'Topic not found' });
  }
});

// ─── Questions ───────────────────────────────────────────────────────────────

const QuestionSchema = z.object({
  text: z.string().min(1),
  optionA: z.string().min(1),
  optionB: z.string().min(1),
  imageUrl: z.string().url().optional(),
  order: z.number().int().optional(),
});

// GET /api/admin/topics/:topicId/questions
router.get('/topics/:topicId/questions', async (req, res) => {
  try {
    const questions = await prisma.question.findMany({
      where: { topicId: req.params.topicId },
      orderBy: { order: 'asc' },
    });
    res.json(questions);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/topics/:topicId/questions
router.post('/topics/:topicId/questions', async (req, res) => {
  const parsed = QuestionSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
  try {
    const question = await prisma.question.create({
      data: { ...parsed.data, topicId: req.params.topicId },
    });
    res.status(201).json(question);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/admin/questions/:id
router.put('/questions/:id', async (req, res) => {
  const parsed = QuestionSchema.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
  try {
    const question = await prisma.question.update({ where: { id: req.params.id }, data: parsed.data });
    res.json(question);
  } catch {
    res.status(404).json({ error: 'Question not found' });
  }
});

// DELETE /api/admin/questions/:id
router.delete('/questions/:id', async (req, res) => {
  try {
    await prisma.question.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch {
    res.status(404).json({ error: 'Question not found' });
  }
});

// ─── Stats ───────────────────────────────────────────────────────────────────

// GET /api/admin/stats
router.get('/stats', async (_req, res) => {
  const [topicCount, roomCount, completedRooms] = await Promise.all([
    prisma.topic.count(),
    prisma.room.count(),
    prisma.room.count({ where: { status: 'COMPLETE' } }),
  ]);
  res.json({ topicCount, roomCount, completedRooms });
});

export default router;
