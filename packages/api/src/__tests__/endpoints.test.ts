import { describe, it, expect, beforeAll, afterAll } from "vitest";
import Fastify from "fastify";
import corsPlugin from "../plugins/cors.js";
import redisPlugin from "../plugins/redis.js";
import rateLimitPlugin from "../plugins/rate-limit.js";
import { scrapeRoutes } from "../routes/scrape.js";
import { scoreRoutes } from "../routes/scores.js";
import { searchRoutes } from "../routes/search.js";
import { enrichmentRoutes } from "../routes/enrichment.js";
import { discoverRoutes } from "../routes/discover.js";

let app: Awaited<ReturnType<typeof Fastify>>;

beforeAll(async () => {
  app = Fastify({ logger: false });
  await app.register(corsPlugin);
  await app.register(redisPlugin);
  await app.register(rateLimitPlugin);
  await app.register(scrapeRoutes, { prefix: "/api/scrape" });
  await app.register(scoreRoutes, { prefix: "/api/scores" });
  await app.register(searchRoutes, { prefix: "/api/search" });
  await app.register(enrichmentRoutes, { prefix: "/api/enrich" });
  await app.register(discoverRoutes, { prefix: "/api/discover" });

  app.get("/health", async () => ({ status: "ok", timestamp: new Date().toISOString() }));

  // Global error handler (matches index.ts)
  app.setErrorHandler((error: Error & { statusCode?: number }, _request, reply) => {
    const statusCode = error.statusCode || 500;
    reply.status(statusCode).send({
      error: statusCode === 500 ? "Internal server error" : error.message,
    });
  });

  await app.ready();
});

afterAll(async () => {
  await app.close();
});

// ─── Health ──────────────────────────────────────────────────────
describe("Health", () => {
  it("GET /health", async () => {
    const res = await app.inject({ method: "GET", url: "/health" });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.status).toBe("ok");
    expect(body.timestamp).toBeDefined();
  });
});

// ─── Scrape ──────────────────────────────────────────────────────
describe("Scrape", () => {
  it("POST /api/scrape/trigger - invalid source returns 400", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/scrape/trigger",
      payload: { source: "invalid" },
    });
    expect(res.statusCode).toBe(400);
  });

  it("POST /api/scrape/trigger - missing source returns 400", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/scrape/trigger",
      payload: {},
    });
    expect(res.statusCode).toBe(400);
  });

  it("POST /api/scrape/trigger - valid source returns 200", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/scrape/trigger",
      payload: { source: "google_places", category: "Test" },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.message).toBeDefined();
    expect(body.jobIds).toBeDefined();
  });

  it("GET /api/scrape/jobs - returns list", async () => {
    const res = await app.inject({ method: "GET", url: "/api/scrape/jobs" });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(Array.isArray(body.jobs)).toBe(true);
  });

  it("GET /api/scrape/jobs?status=pending - filters by status", async () => {
    const res = await app.inject({ method: "GET", url: "/api/scrape/jobs?status=pending" });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(Array.isArray(body.jobs)).toBe(true);
  });

  it("GET /api/scrape/jobs/99999 - returns 404", async () => {
    const res = await app.inject({ method: "GET", url: "/api/scrape/jobs/99999" });
    expect(res.statusCode).toBe(404);
  });

  it("GET /api/scrape/stats - returns stats", async () => {
    const res = await app.inject({ method: "GET", url: "/api/scrape/stats" });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body).toHaveProperty("totalCompanies");
    expect(body).toHaveProperty("totalJobs");
    expect(body).toHaveProperty("activeJobs");
    expect(body).toHaveProperty("recentJobs");
  });
});

// ─── Scores - Company ───────────────────────────────────────────
describe("Scores - Company", () => {
  it("GET /api/scores/company/99999 - returns 404", async () => {
    const res = await app.inject({ method: "GET", url: "/api/scores/company/99999" });
    expect(res.statusCode).toBe(404);
  });

  it("GET /api/scores/company/1 - returns 200 or 404", async () => {
    const res = await app.inject({ method: "GET", url: "/api/scores/company/1" });
    expect([200, 404]).toContain(res.statusCode);
  });

  it("PATCH /api/scores/company/99999 - returns 404", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: "/api/scores/company/99999",
      payload: { website: "https://example.com" },
    });
    expect(res.statusCode).toBe(404);
  });

  it("PATCH /api/scores/company/1 - valid update", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: "/api/scores/company/1",
      payload: { website: "https://test.com" },
    });
    expect([200, 404]).toContain(res.statusCode);
  });

  it("PATCH /api/scores/company/1 - invalid URL returns 400", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: "/api/scores/company/1",
      payload: { website: "not-a-url" },
    });
    expect(res.statusCode).toBe(400);
  });
});

// ─── Scores - Analysis ──────────────────────────────────────────
describe("Scores - Analysis", () => {
  it("POST /api/scores/analyze/99999 - returns 404", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/scores/analyze/99999",
      payload: {},
    });
    expect(res.statusCode).toBe(404);
  });

  it("POST /api/scores/analyze-batch - queues companies", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/scores/analyze-batch",
      payload: { limit: 5 },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.message).toBeDefined();
  });
});

// ─── Scores - Decisions ─────────────────────────────────────────
describe("Scores - Decisions", () => {
  it("POST /api/scores/decide/99999 - returns 404", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/scores/decide/99999",
      payload: { decision: "approved" },
    });
    expect(res.statusCode).toBe(404);
  });

  it("POST /api/scores/decide/1 - invalid decision returns 400", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/scores/decide/1",
      payload: { decision: "invalid" },
    });
    expect(res.statusCode).toBe(400);
  });

  it("GET /api/scores/decisions - returns list", async () => {
    const res = await app.inject({ method: "GET", url: "/api/scores/decisions" });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(Array.isArray(body.companies)).toBe(true);
    expect(body).toHaveProperty("approved");
    expect(body).toHaveProperty("rejected");
    expect(body).toHaveProperty("pending");
  });

  it("GET /api/scores/decisions?filter=pending - filters", async () => {
    const res = await app.inject({ method: "GET", url: "/api/scores/decisions?filter=pending" });
    expect(res.statusCode).toBe(200);
  });

  it("GET /api/scores/decisions?filter=decided - filters", async () => {
    const res = await app.inject({ method: "GET", url: "/api/scores/decisions?filter=decided" });
    expect(res.statusCode).toBe(200);
  });
});

// ─── Scores - Stats ─────────────────────────────────────────────
describe("Scores - Stats", () => {
  it("GET /api/scores/stats - returns stats", async () => {
    const res = await app.inject({ method: "GET", url: "/api/scores/stats" });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body).toHaveProperty("total");
    expect(body).toHaveProperty("analyzed");
    expect(body).toHaveProperty("notAnalyzed");
    expect(body).toHaveProperty("averageScore");
    expect(body).toHaveProperty("byLabel");
  });

  it("GET /api/scores/top - returns top companies", async () => {
    const res = await app.inject({ method: "GET", url: "/api/scores/top" });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(Array.isArray(body.companies)).toBe(true);
  });

  it("GET /api/scores/top?limit=5 - respects limit", async () => {
    const res = await app.inject({ method: "GET", url: "/api/scores/top?limit=5" });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.companies.length).toBeLessThanOrEqual(5);
  });

  it("GET /api/scores/by-category/Restaurantes - returns list or 404", async () => {
    const res = await app.inject({ method: "GET", url: "/api/scores/by-category/Restaurantes" });
    expect([200, 404]).toContain(res.statusCode);
  });
});

// ─── Search ──────────────────────────────────────────────────────
describe("Search", () => {
  it("POST /api/search - empty body returns 400", async () => {
    const res = await app.inject({ method: "POST", url: "/api/search", payload: {} });
    expect(res.statusCode).toBe(400);
  });

  it("POST /api/search - empty query returns 400", async () => {
    const res = await app.inject({ method: "POST", url: "/api/search", payload: { query: "" } });
    expect(res.statusCode).toBe(400);
  });

  it("POST /api/search - valid query (may fail if Ollama is down)", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/search",
      payload: { query: "restaurantes" },
    });
    // 200 if Ollama is up, 500 if not
    expect([200, 500]).toContain(res.statusCode);
  }, 15000);

  it("GET /api/search/logs - returns logs", async () => {
    const res = await app.inject({ method: "GET", url: "/api/search/logs" });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(Array.isArray(body.logs)).toBe(true);
  });
});

// ─── Enrichment ──────────────────────────────────────────────────
describe("Enrichment", () => {
  it("GET /api/enrich/companies - returns list", async () => {
    const res = await app.inject({ method: "GET", url: "/api/enrich/companies" });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(Array.isArray(body.companies)).toBe(true);
    expect(body).toHaveProperty("total");
  });

  it("GET /api/enrich/companies?enriched=true - filters enriched", async () => {
    const res = await app.inject({ method: "GET", url: "/api/enrich/companies?enriched=true" });
    expect(res.statusCode).toBe(200);
  });

  it("GET /api/enrich/companies?enriched=false - filters not enriched", async () => {
    const res = await app.inject({ method: "GET", url: "/api/enrich/companies?enriched=false" });
    expect(res.statusCode).toBe(200);
  });

  it("POST /api/enrich/trigger - missing params returns 400", async () => {
    const res = await app.inject({ method: "POST", url: "/api/enrich/trigger", payload: {} });
    expect(res.statusCode).toBe(400);
  });

  it("POST /api/enrich/trigger - batch mode returns 200", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/enrich/trigger",
      payload: { batch: true, limit: 2 },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.message).toBeDefined();
  });

  it("POST /api/enrich/trigger - single company returns 200", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/enrich/trigger",
      payload: { companyId: 1 },
    });
    expect(res.statusCode).toBe(200);
  });

  it("GET /api/enrich/status - returns queue status", async () => {
    const res = await app.inject({ method: "GET", url: "/api/enrich/status" });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body).toHaveProperty("waiting");
    expect(body).toHaveProperty("active");
    expect(body).toHaveProperty("completed");
    expect(body).toHaveProperty("failed");
    expect(body).toHaveProperty("total");
  });

  it("GET /api/enrich/recent - returns recent jobs", async () => {
    const res = await app.inject({ method: "GET", url: "/api/enrich/recent" });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(Array.isArray(body.jobs)).toBe(true);
  });

  it("DELETE /api/enrich/clean - cleans jobs", async () => {
    const res = await app.inject({ method: "DELETE", url: "/api/enrich/clean" });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.message).toBeDefined();
  });
});

// ─── Discover ────────────────────────────────────────────────────
describe("Discover", () => {
  it("POST /api/discover - empty body returns 400", async () => {
    const res = await app.inject({ method: "POST", url: "/api/discover", payload: {} });
    expect(res.statusCode).toBe(400);
  });

  it("POST /api/discover - short query returns 400", async () => {
    const res = await app.inject({ method: "POST", url: "/api/discover", payload: { query: "ab" } });
    expect(res.statusCode).toBe(400);
  });

  it("POST /api/discover - too long query returns 400", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/discover",
      payload: { query: "a".repeat(201) },
    });
    expect(res.statusCode).toBe(400);
  });

  it.skip("POST /api/discover - full integration (Ollama + Google Places, slow)", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/discover",
      payload: { query: "restaurantes italianos", autoEnrich: false },
    });
    expect([200, 500]).toContain(res.statusCode);
  }, 60000);
});

// ─── 404 for unknown routes ──────────────────────────────────────
describe("Unknown routes", () => {
  it("GET /api/nonexistent returns 404", async () => {
    const res = await app.inject({ method: "GET", url: "/api/nonexistent" });
    expect(res.statusCode).toBe(404);
  });
});
