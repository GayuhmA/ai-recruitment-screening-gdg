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

export function getConnection() {
  const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
  console.log('Connecting to Redis:', REDIS_URL.replace(/:[^:@]+@/, ':***@'));
  return parseRedisUrl(REDIS_URL);
}

// Lazy initialization - only create when first used
let _cvQueue: Queue | null = null;
let _cvQueueEvents: QueueEvents | null = null;

export function getCvQueue(): Queue {
  if (!_cvQueue) {
    const connection = getConnection();
    _cvQueue = new Queue('cv-processing', { connection });
  }
  return _cvQueue;
}

export function getCvQueueEvents(): QueueEvents {
  if (!_cvQueueEvents) {
    const connection = getConnection();
    _cvQueueEvents = new QueueEvents('cv-processing', { connection });
  }
  return _cvQueueEvents;
}

// For backward compatibility - lazy getters
export const cvQueue = {
  add: async (...args: Parameters<Queue['add']>) => getCvQueue().add(...args),
};

export const connection = {
  get host() {
    return getConnection().host;
  },
  get port() {
    return getConnection().port;
  },
  get password() {
    return getConnection().password;
  },
  get username() {
    return getConnection().username;
  },
};
