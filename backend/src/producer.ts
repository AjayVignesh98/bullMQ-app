import { v4 as uuidv4 } from 'uuid';
import { queueMap, queues } from './queues.js';
import type { JobPayload } from './types.js';

const jobTypes: JobPayload['type'][] = ['email', 'report', 'notification', 'data-process'];

function randomPayload(): JobPayload {
  return {
    id: uuidv4(),
    type: jobTypes[Math.floor(Math.random() * jobTypes.length)],
    data: {
      message: `Job created at ${new Date().toISOString()}`,
      value: Math.floor(Math.random() * 1000),
    },
    priority: Math.floor(Math.random() * 10),
  };
}

export async function addRandomJob(): Promise<{ queue: string; jobId: string }> {
  const queueName = ['email', 'report', 'notification'][Math.floor(Math.random() * 3)];
  const queue = queueMap[queueName];
  const payload = randomPayload();

  const job = await queue.add(payload.type, payload, {
    priority: payload.priority,
    removeOnComplete: { count: 50 },
    removeOnFail: { count: 50 },
  });

  return { queue: queueName, jobId: job.id ?? '' };
}

export async function addJobToQueue(queueName: string, customData?: Record<string, unknown>) {
  const queue = queueMap[queueName];
  if (!queue) throw new Error(`Queue "${queueName}" not found`);

  const payload: JobPayload = {
    id: uuidv4(),
    type: 'notification',
    data: customData ?? { message: 'Manual job' },
  };

  const job = await queue.add(payload.type, payload);
  return { queue: queueName, jobId: job.id ?? '' };
}

export async function getQueueStatus(queueName: string) {
  const queue = queueMap[queueName];
  if (!queue) throw new Error(`Queue "${queueName}" not found`);

  const [waiting, active, completed, failed, delayed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount(),
  ]);

  return { waiting, active, completed, failed, delayed };
}

export async function getAllQueueStatuses() {
  const results: Record<string, unknown> = {};

  for (const q of queues) {
    const name = q.name;
    const [waiting, active, completed, failed, delayed, jobs] = await Promise.all([
      q.getWaitingCount(),
      q.getActiveCount(),
      q.getCompletedCount(),
      q.getFailedCount(),
      q.getDelayedCount(),
      q.getJobs(['waiting', 'active', 'completed', 'failed', 'delayed'], 0, 20),
    ]);

    results[name] = {
      waiting,
      active,
      completed,
      failed,
      delayed,
      jobs: await Promise.all(
        jobs.map(async (j) => ({
          id: j.id,
          name: j.name,
          data: j.data,
          status: await j.getState(),
          progress: j.progress,
          timestamp: j.timestamp,
          processedOn: j.processedOn,
          finishedOn: j.finishedOn,
          failedReason: j.failedReason,
        }))
      ),
    };
  }

  return results;
}
