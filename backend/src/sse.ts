import { type Response } from 'express';
import { type Job } from 'bullmq';
import { queues } from './queues.js';
import { workerEntries } from './workers.js';
import { getAllQueueStatuses } from './producer.js';

const clients = new Set<Response>();

function broadcast(event: string, data: unknown) {
  const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of clients) {
    res.write(msg);
  }
}

async function getJobData(job: Job) {
  return {
    id: job.id,
    name: job.name,
    data: job.data,
    status: await job.getState(),
    progress: job.progress,
    timestamp: job.timestamp,
    processedOn: job.processedOn,
    finishedOn: job.finishedOn,
    failedReason: job.failedReason,
  };
}

async function getQueueCounts(queueName: string) {
  const queue = queues.find(q => q.name === queueName);
  if (!queue) return { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 };
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount(),
  ]);
  return { waiting, active, completed, failed, delayed };
}

export function addSSEClient(res: Response) {
  clients.add(res);

  getAllQueueStatuses().then(statuses => {
    res.write(`event: initial\ndata: ${JSON.stringify(statuses)}\n\n`);
  });

  const heartbeat = setInterval(() => {
    res.write(`:heartbeat\n\n`);
  }, 15000);

  res.on('close', () => {
    clients.delete(res);
    clearInterval(heartbeat);
  });
}

export function setupSSEListeners() {
  for (const queue of queues) {
    queue.on('waiting', async (job: Job) => {
      try {
        if (!job) return;
        const [counts, jobData] = await Promise.all([
          getQueueCounts(queue.name),
          getJobData(job),
        ]);
        broadcast('waiting', { queue: queue.name, job: jobData, counts });
      } catch (err) {
        console.error('SSE waiting error:', err);
      }
    });
  }

  for (const { name, worker } of workerEntries) {
    worker.on('active', async (job: Job) => {
      try {
        if (!job) return;
        const [counts, jobData] = await Promise.all([
          getQueueCounts(name),
          getJobData(job),
        ]);
        broadcast('active', { queue: name, job: jobData, counts });
      } catch (err) {
        console.error('SSE active error:', err);
      }
    });

    worker.on('completed', async (job: Job) => {
      try {
        if (!job) return;
        const [counts, jobData] = await Promise.all([
          getQueueCounts(name),
          getJobData(job),
        ]);
        broadcast('completed', { queue: name, job: jobData, counts });
      } catch (err) {
        console.error('SSE completed error:', err);
      }
    });

    worker.on('failed', async (job: Job | undefined, err: Error) => {
      try {
        if (!job) return;
        const [counts, jobData] = await Promise.all([
          getQueueCounts(name),
          getJobData(job),
        ]);
        broadcast('failed', { queue: name, job: jobData, counts });
      } catch (err) {
        console.error('SSE failed error:', err);
      }
    });

    worker.on('progress', async (job: Job) => {
      try {
        if (!job) return;
        const counts = await getQueueCounts(name);
        broadcast('progress', { queue: name, jobId: job.id, progress: job.progress, counts });
      } catch (err) {
        console.error('SSE progress error:', err);
      }
    });
  }
}
