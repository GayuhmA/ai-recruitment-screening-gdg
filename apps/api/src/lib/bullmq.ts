import { Queue, QueueEvents } from 'bullmq';

function parseRedisUrl(url: string) {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname || 'localhost',
      port: parseInt(parsed.port || '6379'),
      password: parsed.password || undefined,
      username: parsed.username || undefined,
    };
  } catch (err) {
    console.error('Failed to parse REDIS_URL, using defaults:', err);
    return { host: 'localhost', port: 6379 };
  }
}

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
console.log('Connecting to Redis:', REDIS_URL.replace(/:[^:@]+@/, ':***@'));

export const connection = parseRedisUrl(REDIS_URL);

export const cvQueue = new Queue('cv-processing', { connection });
export const cvQueueEvents = new QueueEvents('cv-processing', { connection });
