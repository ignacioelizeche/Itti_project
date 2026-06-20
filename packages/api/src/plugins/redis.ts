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
    maxRetriesPerRequest: null,
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
