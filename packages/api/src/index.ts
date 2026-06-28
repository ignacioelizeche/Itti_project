import Fastify from "fastify";
import { Worker } from "bullmq";
import { config } from "./config.js";
import prismaPlugin from "./plugins/prisma.js";
import corsPlugin from "./plugins/cors.js";
import redisPlugin from "./plugins/redis.js";
import { swaggerPlugin } from "./plugins/swagger.js";
import { scrapeRoutes } from "./routes/scrape.js";
import { scoreRoutes } from "./routes/scores.js";
import { searchRoutes } from "./routes/search.js";
import { enrichmentRoutes } from "./routes/enrichment.js";
import { discoverRoutes } from "./routes/discover.js";
import { enrichCompany, enrichBatch } from "./services/enrichment.js";
import { getQueueConnection } from "./lib/queue.js";

const fastify = Fastify({
  logger: {
    level: process.env.NODE_ENV === "development" ? "info" : "warn",
  },
});

async function bootstrap() {
  console.log("Starting server...");
  // Plugins
  await fastify.register(prismaPlugin);
  console.log("Prisma plugin registered");
  await fastify.register(corsPlugin);
  console.log("CORS plugin registered");
  await fastify.register(redisPlugin);
  console.log("Redis plugin registered");
  await fastify.register(swaggerPlugin);
  console.log("Swagger plugin registered");

  // Routes
  await fastify.register(scrapeRoutes, { prefix: "/api/scrape" });
  await fastify.register(scoreRoutes, { prefix: "/api/scores" });
  await fastify.register(searchRoutes, { prefix: "/api/search" });
  await fastify.register(enrichmentRoutes, { prefix: "/api/enrich" });
  await fastify.register(discoverRoutes, { prefix: "/api/discover" });
  console.log("Routes registered");

  // Health check
  fastify.get("/health", async () => {
    return { status: "ok", timestamp: new Date().toISOString() };
  });

  // Start enrichment worker in-process (non-blocking)
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
    { connection: getQueueConnection(), concurrency: 1 }
  );

  enrichmentWorker.on("completed", (job) => {
    console.log(`Enrichment job ${job.id} completed`);
  });
  enrichmentWorker.on("failed", (job, error) => {
    console.error(`Enrichment job ${job?.id} failed:`, error.message);
  });

  // Graceful shutdown
  fastify.addHook("onClose", async () => {
    await enrichmentWorker.close();
  });

  process.on("SIGTERM", async () => {
    await fastify.close();
  });
  process.on("SIGINT", async () => {
    await fastify.close();
  });

  // Start server
  await fastify.listen({ port: config.port, host: "0.0.0.0" });

  console.log(`🚀 API running on http://localhost:${config.port}`);
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
