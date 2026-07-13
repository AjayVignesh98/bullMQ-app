import type { QueueJob } from '../api/bull.js';

interface JobCardProps {
  job: QueueJob;
}

const statusColors: Record<string, string> = {
  waiting: '#f59e0b',
  active: '#3b82f6',
  completed: '#10b981',
  failed: '#ef4444',
  delayed: '#8b5cf6',
  paused: '#6b7280',
};

const ts = (v: number | null) => (v ? new Date(v).toLocaleTimeString() : '-');

export function JobCard({ job }: JobCardProps) {
  return (
    <div style={{
      border: `1px solid ${statusColors[job.status] || '#ccc'}`,
      borderLeft: `4px solid ${statusColors[job.status] || '#ccc'}`,
      borderRadius: 6,
      padding: '8px 12px',
      marginBottom: 6,
      fontSize: 13,
      background: '#1a1a2e',
      color: '#e0e0e0',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <strong>{job.name}</strong>
        <span style={{
          background: statusColors[job.status] || '#666',
          color: '#fff',
          padding: '1px 8px',
          borderRadius: 10,
          fontSize: 11,
        }}>
          {job.status}
        </span>
      </div>
      <div style={{ marginTop: 4, display: 'flex', gap: 16, fontSize: 12, color: '#aaa' }}>
        <span>ID: {job.id?.slice(0, 8)}</span>
        <span>Progress: {job.progress}%</span>
        <span>Created: {ts(job.timestamp)}</span>
      </div>
      {job.failedReason && (
        <div style={{ marginTop: 4, color: '#ef4444', fontSize: 12 }}>
          {job.failedReason}
        </div>
      )}
    </div>
  );
}
