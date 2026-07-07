import { Worker, Job } from "bullmq";
import { config } from "../config.js";
import { logger } from "../lib/logger.js";
import { getQueueConnection } from "../lib/queue.js";
import { enrichCompany, enrichBatch } from "../services/enrichment.js";

const enrichmentWorker = new Worker(
  "enrichment",
  async (job: Job) => {
    const { companyId, batch, limit } = job.data;
    if (batch) {
      const enriched = await enrichBatch(limit ?? 10);
      return { enriched, type: "batch" };
    }
    if (companyId) {
      const result = await enrichCompany(companyId);
      return { result, type: "single" };
    }
    throw new Error("No companyId or batch flag provided");
  },
  { connection: getQueueConnection(), concurrency: config.workers.concurrency, lockDuration: 300000 }
);

enrichmentWorker.on("completed", (job) => {
  logger.info(`Enrichment job ${job.id} completed`);
});

enrichmentWorker.on("failed", (job, error) => {
  logger.error(error, `Enrichment job ${job?.id} failed`);
});

export { enrichmentWorker };
