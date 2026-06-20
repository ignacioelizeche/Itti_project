import Fastify from "fastify";
import { config } from "./config.js";
import prismaPlugin from "./plugins/prisma.js";
import corsPlugin from "./plugins/cors.js";
import redisPlugin from "./plugins/redis.js";
import { scrapeRoutes } from "./routes/scrape.js";
import { scoreRoutes } from "./routes/scores.js";
import { searchRoutes } from "./routes/search.js";
import { enrichmentRoutes } from "./routes/enrichment.js";

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

  // Routes
  await fastify.register(scrapeRoutes, { prefix: "/api/scrape" });
  await fastify.register(scoreRoutes, { prefix: "/api/scores" });
  await fastify.register(searchRoutes, { prefix: "/api/search" });
  await fastify.register(enrichmentRoutes, { prefix: "/api/enrich" });
  console.log("Routes registered");

  // Health check
  fastify.get("/health", async () => {
    return { status: "ok", timestamp: new Date().toISOString() };
  });

  // Start server
  await fastify.listen({ port: config.port, host: "0.0.0.0" });

  console.log(`🚀 API running on http://localhost:${config.port}`);
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
