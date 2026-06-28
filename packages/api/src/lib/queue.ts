import { config } from "../config.js";

export function getQueueConnection() {
  return {
    host: config.redis.url ? new URL(config.redis.url).hostname : "localhost",
    port: config.redis.url ? Number(new URL(config.redis.url).port || "6379") : 6379,
    maxRetriesPerRequest: null,
  };
}
