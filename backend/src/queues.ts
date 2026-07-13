import { Queue } from 'bullmq';
import { connection } from './redis.js';

export const emailQueue = new Queue('email', { connection });
export const reportQueue = new Queue('report', { connection });
export const notificationQueue = new Queue('notification', { connection });

export const queues = [emailQueue, reportQueue, notificationQueue];

export const queueMap: Record<string, Queue> = {
  email: emailQueue,
  report: reportQueue,
  notification: notificationQueue,
};
