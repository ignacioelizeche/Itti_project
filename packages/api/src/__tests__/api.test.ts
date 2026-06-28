import { describe, it, expect, beforeAll, afterAll } from "vitest";
import Fastify from "fastify";
import corsPlugin from "../plugins/cors.js";
import redisPlugin from "../plugins/redis.js";
import { scoreRoutes } from "../routes/scores.js";
import { searchRoutes } from "../routes/search.js";
import { discoverRoutes } from "../routes/discover.js";
import { scrapeRoutes } from "../routes/scrape.js";

let app: Awaited<ReturnType<typeof Fastify>>;

beforeAll(async () => {
  app = Fastify({ logger: false });
  await app.register(corsPlugin);
  await app.register(redisPlugin);
  await app.register(scrapeRoutes, { prefix: "/api/scrape" });
  await app.register(scoreRoutes, { prefix: "/api/scores" });
  await app.register(searchRoutes, { prefix: "/api/search" });
  await app.register(discoverRoutes, { prefix: "/api/discover" });
  app.get("/health", async () => ({ status: "ok", timestamp: new Date().toISOString() }));
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

describe("Health", () => {
  it("GET /health returns ok", async () => {
    const res = await app.inject({ method: "GET", url: "/health" });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.status).toBe("ok");
    expect(body.timestamp).toBeDefined();
  });
});

describe("Scores - Company", () => {
  it("GET /api/scores/company/99999 returns 404", async () => {
    const res = await app.inject({ method: "GET", url: "/api/scores/company/99999" });
    expect(res.statusCode).toBe(404);
  });

  it("GET /api/scores/company/1 returns 200 or 404", async () => {
    const res = await app.inject({ method: "GET", url: "/api/scores/company/1" });
    expect([200, 404]).toContain(res.statusCode);
  });

  it("GET /api/scores/stats returns stats object", async () => {
    const res = await app.inject({ method: "GET", url: "/api/scores/stats" });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body).toHaveProperty("total");
    expect(body).toHaveProperty("analyzed");
    expect(body).toHaveProperty("averageScore");
  });
});

describe("Search - Validation", () => {
  it("POST /api/search with empty body returns 400", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/search",
      payload: {},
    });
    expect(res.statusCode).toBe(400);
  });

  it("POST /api/search with empty query returns 400", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/search",
      payload: { query: "" },
    });
    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.payload);
    expect(body.error).toBeDefined();
  });
});

describe("Discover - Validation", () => {
  it("POST /api/discover with empty body returns 400", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/discover",
      payload: {},
    });
    expect(res.statusCode).toBe(400);
  });

  it("POST /api/discover with short query returns 400", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/discover",
      payload: { query: "ab" },
    });
    expect(res.statusCode).toBe(400);
  });
});

describe("Scrape - Validation", () => {
  it("POST /api/scrape/trigger with invalid source returns 400", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/scrape/trigger",
      payload: { source: "invalid" },
    });
    expect(res.statusCode).toBe(400);
  });

  it("POST /api/scrape/trigger with valid source returns 200", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/scrape/trigger",
      payload: { source: "google_places", category: "Test" },
    });
    expect(res.statusCode).toBe(200);
  });
});
