import { Worker, Job } from "bullmq";
import { config } from "../config.js";
import { prisma } from "../lib/prisma.js";
import { getQueueConnection } from "../lib/queue.js";
import { analyzeCompany } from "../services/ai/analysis-pipeline.js";

interface AnalyzeJobData {
  companyId: number;
  force?: boolean;
}

const analyzeWorker = new Worker(
  "analyze",
  async (job: Job<AnalyzeJobData>) => {
    const { companyId, force } = job.data;

    if (!force) {
      const existing = await prisma.companyScore.findUnique({
        where: { companyId },
      });
      if (existing) {
        console.log(`[AnalyzeWorker] Company ${companyId} already analyzed, skipping`);
        return { skipped: true };
      }
    }

    await analyzeCompany(companyId);
    await new Promise((r) => setTimeout(r, config.workers.analyzeDelayMs));
    return { success: true };
  },
  {
    connection: getQueueConnection(),
    concurrency: config.workers.concurrency,
  }
);

analyzeWorker.on("completed", (job) => {
  console.log(`[AnalyzeWorker] Job ${job.id} completed for company ${job.data.companyId}`);
});

analyzeWorker.on("failed", (job, err) => {
  console.error(`[AnalyzeWorker] Job ${job?.id} failed:`, err.message);
});

export { analyzeWorker };
