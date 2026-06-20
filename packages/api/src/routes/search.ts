import type { FastifyInstance } from "fastify";
import { semanticSearch, hybridSearch } from "../services/search/semantic.js";

export async function searchRoutes(fastify: FastifyInstance) {
  // POST /api/search - Semantic search
  fastify.post<{
    Body: {
      query: string;
      limit?: number;
      category?: string;
      minScore?: number;
      city?: string;
    };
  }>("/", async (request, reply) => {
    const { query, limit = 20, category, minScore, city } = request.body;

    if (!query || query.trim().length === 0) {
      return reply.status(400).send({ error: "Query is required" });
    }

    try {
      const results = await semanticSearch(query, {
        limit,
        category,
        minScore,
        city,
      });

      // Log the search
      const prisma = fastify.prisma;
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
  fastify.post<{
    Body: {
      query: string;
      limit?: number;
      category?: string;
      minScore?: number;
      city?: string;
      textFilter?: string;
    };
  }>("/hybrid", async (request, reply) => {
    const { query, limit = 20, category, minScore, city, textFilter } = request.body;

    if (!query || query.trim().length === 0) {
      return reply.status(400).send({ error: "Query is required" });
    }

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
