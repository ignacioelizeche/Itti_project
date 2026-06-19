import Fastify from "fastify";
import { config } from "./config.js";
import prismaPlugin from "./plugins/prisma.js";
import corsPlugin from "./plugins/cors.js";
import redisPlugin from "./plugins/redis.js";

const fastify = Fastify({
  logger: {
    level: process.env.NODE_ENV === "development" ? "info" : "warn",
  },
});

async function bootstrap() {
  // Plugins
  await fastify.register(prismaPlugin);
  await fastify.register(corsPlugin);
  await fastify.register(redisPlugin);

  // Health check
  fastify.get("/health", async () => {
    return { status: "ok", timestamp: new Date().toISOString() };
  });

  // Start server
  await fastify.listen({ port: config.port, host: "0.0.0.0" });

  fastify.log.info(`🚀 API running on http://localhost:${config.port}`);
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
