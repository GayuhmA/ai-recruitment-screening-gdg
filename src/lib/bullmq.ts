import { Queue, type ConnectionOptions } from "bullmq";
import { mustEnv } from "./env.js";

function parseRedisUrl(urlStr: string): ConnectionOptions {
    const u = new URL(urlStr);

    // BullMQ ConnectionOptions (POJO), aman dari konflik ioredis
    const conn: ConnectionOptions = {
        host: u.hostname,
        port: u.port ? Number(u.port) : 6379,
        maxRetriesPerRequest: null,
    };

    if (u.password) conn.password = decodeURIComponent(u.password);
    if (u.username) conn.username = decodeURIComponent(u.username);

    // redis://host:6379/1 => db 1
    if (u.pathname && u.pathname !== "/") {
        const db = Number(u.pathname.slice(1));
        if (!Number.isNaN(db)) conn.db = db;
    }

    return conn;
}

export const connection = parseRedisUrl(mustEnv("REDIS_URL"));

export const cvQueue = new Queue("cv-processing", { connection });
export const aiQueue = new Queue("ai-tasks", { connection });
