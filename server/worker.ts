import IORedis from "ioredis";
import { Worker } from "bullmq";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const connection = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });

const worker = new Worker(
  "metro-world",
  async (job) => {
    console.log("processing job", job.name, job.id, job.data);
    return { ok: true };
  },
  { connection, concurrency: 4 },
);

worker.on("completed", (job) => {
  console.log("job completed", job.id, job.name);
});

worker.on("failed", (job, error) => {
  console.error("job failed", job?.id, job?.name, error);
});

console.log("Metro Syndicate worker started.");
