import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";
import { semanticSearch, hybridSearch } from "../services/search/semantic.js";
import { SearchSchema, HybridSearchSchema } from "../schemas/index.js";

export async function searchRoutes(fastify: FastifyInstance) {
  // POST /api/search - Semantic search
  fastify.post("/", {
    schema: {
      tags: ["Search"],
      summary: "Búsqueda semántica de empresas",
      description: "Busca empresas usando embeddings y lenguaje natural",
    },
  }, async (request, reply) => {
    const parseResult = SearchSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: parseResult.error.issues[0].message });
    }

    const { query, limit, category, minScore, city } = parseResult.data;

    try {
      const results = await semanticSearch(query, {
        limit,
        category,
        minScore,
        city,
      });

      // Log the search
      await prisma.searchLog.create({
        data: {
          query,
          resultCount: results.length,
          topScore: results[0]?.totalScore || null,
        },
      });

      return {
        query,
        results,
        total: results.length,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Search failed";
      return reply.status(500).send({ error: message });
    }
  });

  // POST /api/search/hybrid - Hybrid search (semantic + filters)
  fastify.post("/hybrid", {
    schema: {
      tags: ["Search"],
      summary: "Búsqueda híbrida (semántica + filtros)",
    },
  }, async (request, reply) => {
    const parseResult = HybridSearchSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: parseResult.error.issues[0].message });
    }

    const { query, limit, category, minScore, city, textFilter } = parseResult.data;

    try {
      const results = await hybridSearch(query, {
        limit,
        category,
        minScore,
        city,
        textFilter,
      });

      // Log the search
      await prisma.searchLog.create({
        data: {
          query,
          resultCount: results.length,
          topScore: results[0]?.totalScore || null,
        },
      });

      return {
        query,
        filters: { category, minScore, city, textFilter },
        results,
        total: results.length,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Search failed";
      return reply.status(500).send({ error: message });
    }
  });

  // GET /api/search/logs - Recent search logs
  fastify.get<{
    Querystring: { limit?: string };
  }>("/logs", async (request) => {
    const { limit = "20" } = request.query;
    const prisma = fastify.prisma;

    const logs = await prisma.searchLog.findMany({
      orderBy: { createdAt: "desc" },
      take: parseInt(limit),
    });

    return { logs };
  });
}
