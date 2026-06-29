import Fastify from "fastify";
import { config } from "./config.js";
import corsPlugin from "./plugins/cors.js";
import redisPlugin from "./plugins/redis.js";
import rateLimitPlugin from "./plugins/rate-limit.js";
import { swaggerPlugin } from "./plugins/swagger.js";
import { scrapeRoutes } from "./routes/scrape.js";
import { scoreRoutes } from "./routes/scores.js";
import { searchRoutes } from "./routes/search.js";
import { enrichmentRoutes } from "./routes/enrichment.js";
import { discoverRoutes } from "./routes/discover.js";
import { enrichmentWorker } from "./workers/enrichment-worker.js";

const fastify = Fastify({
  logger: {
    level: process.env.NODE_ENV === "development" ? "info" : "warn",
  },
});

async function bootstrap() {
  // Plugins
  await fastify.register(corsPlugin);
  await fastify.register(redisPlugin);
  await fastify.register(rateLimitPlugin);
  await fastify.register(swaggerPlugin);

  // Global error handler
  fastify.setErrorHandler((error: Error & { statusCode?: number }, _request, reply) => {
    fastify.log.error(error);
    const statusCode = error.statusCode || 500;
    reply.status(statusCode).send({
      error: statusCode === 500 ? "Internal server error" : error.message,
    });
  });

  // Routes
  await fastify.register(scrapeRoutes, { prefix: "/api/scrape" });
  await fastify.register(scoreRoutes, { prefix: "/api/scores" });
  await fastify.register(searchRoutes, { prefix: "/api/search" });
  await fastify.register(enrichmentRoutes, { prefix: "/api/enrich" });
  await fastify.register(discoverRoutes, { prefix: "/api/discover" });

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
}

bootstrap().catch((err) => {
  fastify.log.error(err);
  process.exit(1);
});
