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
  },

  google: {
    mapsApiKey: process.env.GOOGLE_MAPS_API_KEY || "",
  },
};
