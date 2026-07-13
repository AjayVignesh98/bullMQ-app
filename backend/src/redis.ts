import { parse } from 'node:url';

function parseRedisUrl(url: string) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname || 'localhost',
    port: parsed.port ? parseInt(parsed.port, 10) : 6379,
    username: parsed.username || undefined,
    password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
    db: parsed.pathname ? parseInt(parsed.pathname.slice(1), 10) || 0 : 0,
  };
}

const url = process.env.REDIS_URL || 'redis://localhost:6379';

export const connection = {
  ...parseRedisUrl(url),
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
};
