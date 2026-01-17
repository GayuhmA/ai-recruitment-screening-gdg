import { Queue, QueueEvents } from "bullmq";
import { mustEnv } from "./env.js";

const REDIS_URL = mustEnv("REDIS_URL");

export const connection = {
  host: new URL(REDIS_URL).hostname,
  port: parseInt(new URL(REDIS_URL).port || "6379"),
};

export const cvQueue = new Queue("cv-processing", { connection });
export const cvQueueEvents = new QueueEvents("cv-processing", { connection });
