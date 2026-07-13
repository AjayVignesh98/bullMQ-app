import { useEffect, useState } from 'react';
import type { QueuesData } from '../api/bull.js';
import { addRandomJob, connectQueueEvents } from '../api/bull.js';
import type { SSEEvent } from '../api/bull.js';
import { JobCard } from './JobCard.js';

function applyDelta(prev: QueuesData | null, event: SSEEvent): QueuesData | null {
  if (event.type === 'initial') return event.data;
  if (!prev || !prev[event.queue]) return prev;

  const queue = prev[event.queue];
  switch (event.type) {
    case 'waiting':
    case 'active':
    case 'completed':
    case 'failed':
      return {
        ...prev,
        [event.queue]: {
          ...queue,
          ...event.counts,
          jobs: [event.job, ...queue.jobs.filter(j => j.id !== event.job.id)].slice(0, 20),
        },
      };
    case 'progress':
      return {
        ...prev,
        [event.queue]: {
          ...queue,
          jobs: queue.jobs.map(j => j.id === event.jobId ? { ...j, progress: event.progress } : j),
        },
      };
    default:
      return prev;
  }
}

export function QueueDashboard() {
  const [data, setData] = useState<QueuesData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cleanup = connectQueueEvents((event) => {
      if (event.type === 'initial') setLoading(false);
      setData(prev => applyDelta(prev, event));
    });
    return cleanup;
  }, []);

  const handleAddRandom = async () => {
    await addRandomJob();
  };

  if (loading) {
    return <div style={styles.loading}>Loading queue data...</div>;
  }

  if (!data) {
    return <div style={styles.loading}>No data available. Is the backend running?</div>;
  }

  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.title}>BullMQ Dashboard</h1>
        <button onClick={handleAddRandom} style={styles.addBtn}>
          + Add Random Job
        </button>
      </div>

      <div style={styles.grid}>
        {Object.entries(data).map(([name, queue]) => (
          <div key={name} style={styles.queueCard}>
            <div style={styles.queueHeader}>
              <h2 style={styles.queueName}>{name} queue</h2>
            </div>

            <div style={styles.counts}>
              {[
                ['Waiting', queue.waiting, '#f59e0b'],
                ['Active', queue.active, '#3b82f6'],
                ['Completed', queue.completed, '#10b981'],
                ['Failed', queue.failed, '#ef4444'],
                ['Delayed', queue.delayed, '#8b5cf6'],
              ].map(([label, count, color]) => (
                <div key={label as string} style={styles.countItem}>
                  <span style={{ ...styles.countValue, color: color as string }}>{count as number}</span>
                  <span style={styles.countLabel}>{label as string}</span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 12 }}>
              <h3 style={{ color: '#aaa', fontSize: 12, marginBottom: 6 }}>Recent Jobs</h3>
              {queue.jobs.length === 0 ? (
                <div style={{ color: '#666', fontSize: 13 }}>No jobs yet</div>
              ) : (
                queue.jobs.map((job) => <JobCard key={job.id} job={job} />)
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  loading: {
    textAlign: 'center',
    padding: 40,
    color: '#888',
    fontSize: 16,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    margin: 0,
    fontSize: 24,
    color: '#e0e0e0',
  },
  addBtn: {
    background: '#3b82f6',
    color: '#fff',
    border: 'none',
    padding: '10px 20px',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
    gap: 20,
  },
  queueCard: {
    background: '#16213e',
    borderRadius: 10,
    padding: 16,
    border: '1px solid #0f3460',
  },
  queueHeader: {
    marginBottom: 12,
  },
  queueName: {
    margin: 0,
    fontSize: 18,
    color: '#e0e0e0',
    textTransform: 'capitalize',
  },
  counts: {
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap' as const,
  },
  countItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    background: '#1a1a2e',
    borderRadius: 8,
    padding: '8px 14px',
    minWidth: 60,
  },
  countValue: {
    fontSize: 22,
    fontWeight: 700,
  },
  countLabel: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
};
