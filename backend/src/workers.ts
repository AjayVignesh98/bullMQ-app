import { Worker } from 'bullmq';
import { connection } from './redis.js';

function createWorker(queueName: string) {
  const worker = new Worker(
    queueName,
    async (job) => {
      console.log(`[${queueName}] Processing job ${job.id}: ${job.name}`);

      const totalSteps = 5;
      for (let step = 1; step <= totalSteps; step++) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await job.updateProgress(Math.round((step / totalSteps) * 100));
      }

      console.log(`[${queueName}] Completed job ${job.id}`);
      return { processed: true, queue: queueName, jobId: job.id };
    },
    {
      connection,
      concurrency: 3,
      removeOnComplete: { count: 50 },
      removeOnFail: { count: 50 },
    }
  );

  worker.on('failed', (job, err) => {
    console.error(`[${queueName}] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}

export const emailWorker = createWorker('email');
export const reportWorker = createWorker('report');
export const notificationWorker = createWorker('notification');

export const workers = [emailWorker, reportWorker, notificationWorker];
export const workerEntries = [
  { name: 'email', worker: emailWorker },
  { name: 'report', worker: reportWorker },
  { name: 'notification', worker: notificationWorker },
];
