const BASE = '/api';

export interface QueueJob {
  id: string;
  name: string;
  data: Record<string, unknown>;
  status: string;
  progress: number;
  timestamp: number | null;
  processedOn: number | null;
  finishedOn: number | null;
  failedReason: string | null;
}

export interface QueueStatus {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  jobs: QueueJob[];
}

export interface QueuesData {
  [name: string]: QueueStatus;
}

export async function addRandomJob() {
  const res = await fetch(`${BASE}/jobs/random`, { method: 'POST' });
  return res.json();
}

export async function addJob(queue: string, data?: Record<string, unknown>) {
  const res = await fetch(`${BASE}/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ queue, data }),
  });
  return res.json();
}

export async function getQueueStatus(name: string) {
  const res = await fetch(`${BASE}/queues/${name}`);
  return res.json();
}

export async function getAllQueues(): Promise<QueuesData> {
  const res = await fetch(`${BASE}/queues`);
  const data = await res.json();
  return data.queues as QueuesData;
}

export interface SSECounts {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

export type SSEEvent =
  | { type: 'initial'; data: QueuesData }
  | { type: 'waiting'; queue: string; job: QueueJob; counts: SSECounts }
  | { type: 'active'; queue: string; job: QueueJob; counts: SSECounts }
  | { type: 'completed'; queue: string; job: QueueJob; counts: SSECounts }
  | { type: 'failed'; queue: string; job: QueueJob; counts: SSECounts }
  | { type: 'progress'; queue: string; jobId: string; progress: number; counts: SSECounts };

export function connectQueueEvents(onEvent: (event: SSEEvent) => void): () => void {
  const es = new EventSource(`${BASE}/events`);

  es.addEventListener('initial', (e: MessageEvent) => {
    onEvent({ type: 'initial', data: JSON.parse(e.data) });
  });

  es.addEventListener('waiting', (e: MessageEvent) => {
    const { queue, job, counts } = JSON.parse(e.data);
    onEvent({ type: 'waiting', queue, job, counts });
  });

  es.addEventListener('active', (e: MessageEvent) => {
    const { queue, job, counts } = JSON.parse(e.data);
    onEvent({ type: 'active', queue, job, counts });
  });

  es.addEventListener('completed', (e: MessageEvent) => {
    const { queue, job, counts } = JSON.parse(e.data);
    onEvent({ type: 'completed', queue, job, counts });
  });

  es.addEventListener('failed', (e: MessageEvent) => {
    const { queue, job, counts } = JSON.parse(e.data);
    onEvent({ type: 'failed', queue, job, counts });
  });

  es.addEventListener('progress', (e: MessageEvent) => {
    const { queue, jobId, progress, counts } = JSON.parse(e.data);
    onEvent({ type: 'progress', queue, jobId, progress, counts });
  });

  es.addEventListener('error', () => {
    console.error('SSE connection error');
  });

  return () => es.close();
}
