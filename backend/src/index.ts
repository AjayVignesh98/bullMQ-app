import express from 'express';
import cors from 'cors';
import { addRandomJob, addJobToQueue, getQueueStatus, getAllQueueStatuses } from './producer.js';
import { workers } from './workers.js';
import { addSSEClient, setupSSEListeners } from './sse.js';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

app.use(cors());
app.use(express.json());

app.post('/api/jobs/random', async (_req, res) => {
  try {
    const result = await addRandomJob();
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

app.post('/api/jobs', async (req, res) => {
  try {
    const { queue, data } = req.body;
    if (!queue) {
      res.status(400).json({ success: false, error: 'queue is required' });
      return;
    }
    const result = await addJobToQueue(queue, data);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

app.get('/api/queues/:name', async (req, res) => {
  try {
    const status = await getQueueStatus(req.params.name);
    res.json({ success: true, queue: req.params.name, ...status });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

app.get('/api/queues', async (_req, res) => {
  try {
    const statuses = await getAllQueueStatuses();
    res.json({ success: true, queues: statuses });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

app.get('/api/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  addSSEClient(res);
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', workers: workers.length });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
  setupSSEListeners();
});
