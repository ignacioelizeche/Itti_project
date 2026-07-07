import Redis from "ioredis";
import type { FastifyInstance } from "fastify";
import fastifyPlugin from "fastify-plugin";
import { config } from "../config.js";

declare module "fastify" {
  interface FastifyInstance {
    redis: Redis;
  }
}

async function redisPlugin(fastify: FastifyInstance) {
  const redis = new Redis(config.redis.url, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 10) return null;
      return Math.min(times * 200, 5000);
    },
  });

  redis.on("error", (err) => {
    fastify.log.error(err, "Redis connection error");
  });

  fastify.decorate("redis", redis);

  fastify.addHook("onClose", async () => {
    await redis.quit();
  });
}

export default fastifyPlugin(redisPlugin, { name: "redis" });
