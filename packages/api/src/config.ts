import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

export const config = {
  port: parseInt(process.env.API_PORT || "3001", 10),

  redis: {
    url: process.env.REDIS_URL || "redis://localhost:6379",
  },

  ollama: {
    url: process.env.OLLAMA_URL || "http://192.168.2.33:30068",
    embedModel: process.env.OLLAMA_EMBED_MODEL || "nomic-embed-text",
    chatModel: process.env.OLLAMA_CHAT_MODEL || "llama3.1:8b",
    timeout: parseInt(process.env.OLLAMA_TIMEOUT || "120000", 10),
    maxRetries: parseInt(process.env.OLLAMA_MAX_RETRIES || "3", 10),
    retryBaseDelay: parseInt(process.env.OLLAMA_RETRY_BASE_DELAY || "3000", 10),
  },

  google: {
    mapsApiKey: process.env.GOOGLE_MAPS_API_KEY || "",
  },

  scraper: {
    googlePlacesRadius: parseInt(process.env.SCRAPER_GOOGLE_RADIUS || "15000", 10),
    googlePlacesMaxResults: parseInt(process.env.SCRAPER_GOOGLE_MAX_RESULTS || "20", 10),
    googlePlacesRateLimitMs: parseInt(process.env.SCRAPER_GOOGLE_RATE_LIMIT || "500", 10),
    directoryRateLimitMs: parseInt(process.env.SCRAPER_DIRECTORY_RATE_LIMIT || "2000", 10),
  },

  workers: {
    concurrency: parseInt(process.env.WORKER_CONCURRENCY || "1", 10),
    analyzeDelayMs: parseInt(process.env.WORKER_ANALYZE_DELAY || "6500", 10),
    scrapeAttempts: parseInt(process.env.WORKER_SCRAPE_ATTEMPTS || "2", 10),
    scrapeBackoffDelay: parseInt(process.env.WORKER_SCRAPE_BACKOFF_DELAY || "5000", 10),
    analyzeAttempts: parseInt(process.env.WORKER_ANALYZE_ATTEMPTS || "3", 10),
    analyzeBackoffDelay: parseInt(process.env.WORKER_ANALYZE_BACKOFF_DELAY || "30000", 10),
    discoverAttempts: parseInt(process.env.WORKER_DISCOVER_ATTEMPTS || "2", 10),
    discoverBackoffDelay: parseInt(process.env.WORKER_DISCOVER_BACKOFF_DELAY || "5000", 10),
  },
};
