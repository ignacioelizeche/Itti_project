import { Worker, Job } from "bullmq";
import { config } from "../config.js";
import { prisma } from "../lib/prisma.js";
import { logger } from "../lib/logger.js";
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
        logger.info(`[AnalyzeWorker] Company ${companyId} already analyzed, skipping`);
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
  logger.info(`[AnalyzeWorker] Job ${job.id} completed for company ${job.data.companyId}`);
});

analyzeWorker.on("failed", (job, err) => {
  logger.error(err, `[AnalyzeWorker] Job ${job?.id} failed`);
});

analyzeWorker.on("error", (err) => {
  logger.error(err, `[AnalyzeWorker] Worker error`);
});

analyzeWorker.waitUntilReady().then(() => {
  logger.info("[AnalyzeWorker] Worker connected and ready");
}).catch((err) => {
  logger.error(err, "[AnalyzeWorker] Worker failed to connect");
});

export { analyzeWorker };
