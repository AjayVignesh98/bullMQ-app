import { QueueDashboard } from './components/QueueDashboard.js';

export default function App() {
  return (
    <div style={styles.container}>
      <QueueDashboard />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '24px 20px',
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    minHeight: '100vh',
    background: '#0a0a1a',
  },
};
