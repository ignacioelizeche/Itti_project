import { Worker } from "bullmq";
import { prisma } from "../index.js";
import { enrichCompany, enrichBatch } from "../services/enrichment.js";

const connection = { host: "localhost", port: 6379 };

const enrichmentWorker = new Worker(
  "enrichment",
  async (job) => {
    const { companyId, batch, limit } = job.data;

    if (batch) {
      const enriched = await enrichBatch(limit || 10);
      return { enriched, type: "batch" };
    }

    if (companyId) {
      const result = await enrichCompany(companyId);
      return { result, type: "single" };
    }

    return { error: "No companyId or batch flag provided" };
  },
  {
    connection,
    concurrency: 1, // One enrichment at a time to avoid rate limits
  }
);

enrichmentWorker.on("completed", (job) => {
  console.log(` Enrichment job ${job.id} completed:`, job.returnvalue);
});

enrichmentWorker.on("failed", (job, error) => {
  console.error(` Enrichment job ${job?.id} failed:`, error.message);
});

console.log(" Enrichment worker started");

// Keep the process alive
process.on("SIGTERM", async () => {
  await enrichmentWorker.close();
  process.exit(0);
});
