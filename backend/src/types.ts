export interface JobPayload {
  id: string;
  type: 'email' | 'report' | 'notification' | 'data-process';
  data: Record<string, unknown>;
  priority?: number;
}

export interface JobStatus {
  jobId: string;
  queue: string;
  status: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed' | 'paused';
  progress: number;
  data?: JobPayload;
  createdAt?: Date;
  processedAt?: Date;
  failedReason?: string;
}
