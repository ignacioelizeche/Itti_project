import "dotenv/config";

export const config = {
  port: parseInt(process.env.API_PORT || "3001", 10),
  nodeEnv: process.env.NODE_ENV || "development",

  database: {
    url: process.env.DATABASE_URL!,
  },

  redis: {
    url: process.env.REDIS_URL || "redis://localhost:6379",
  },

  groq: {
    apiKey: process.env.GROQ_API_KEY || "",
  },

  ollama: {
    url: process.env.OLLAMA_URL || "http://localhost:11434",
    embedModel: process.env.OLLAMA_EMBED_MODEL || "nomic-embed-text",
    chatModel: process.env.OLLAMA_CHAT_MODEL || "llama3.1",
  },

  google: {
    mapsApiKey: process.env.GOOGLE_MAPS_API_KEY || "",
  },
};
