import express from 'express';
import cors from 'cors';
import topicsRouter from './routes/topics';
import roomsRouter from './routes/rooms';
import adminRouter from './routes/admin';
import authRouter from './routes/auth';
import unlinkRouter from './routes/unlink';

const app = express();
const PORT = process.env.PORT ?? 8080;

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN ?? '*';
app.use(cors({ origin: ALLOWED_ORIGIN }));
app.use(express.json());

// Health check for GCP Cloud Run
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRouter);
app.use('/api/auth', unlinkRouter);
app.use('/api/topics', topicsRouter);
app.use('/api/rooms', roomsRouter);
app.use('/api/admin', adminRouter);

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
