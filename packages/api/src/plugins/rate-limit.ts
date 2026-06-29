import rateLimit from "@fastify/rate-limit";
import type { FastifyInstance } from "fastify";
import fastifyPlugin from "fastify-plugin";

async function rateLimitPlugin(fastify: FastifyInstance) {
  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
  });
}

export default fastifyPlugin(rateLimitPlugin, { name: "rate-limit" });
