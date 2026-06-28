import type { FastifyInstance } from "fastify";
import { companyRoutes } from "./scores/company.js";
import { analysisRoutes } from "./scores/analysis.js";
import { decisionRoutes } from "./scores/decisions.js";
import { statsRoutes } from "./scores/stats.js";

export async function scoreRoutes(fastify: FastifyInstance) {
  await fastify.register(companyRoutes);
  await fastify.register(analysisRoutes);
  await fastify.register(decisionRoutes);
  await fastify.register(statsRoutes);
}
