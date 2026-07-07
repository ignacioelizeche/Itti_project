import cors from "@fastify/cors";
import type { FastifyInstance } from "fastify";
import fastifyPlugin from "fastify-plugin";

async function corsPlugin(fastify: FastifyInstance) {
  const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",").map((o) => o.trim())
    : [];

  await fastify.register(cors, {
    origin: process.env.NODE_ENV === "production"
      ? (origin, callback) => {
          if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
          } else {
            callback(new Error("Not allowed by CORS"), false);
          }
        }
      : true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  });
}

export default fastifyPlugin(corsPlugin, { name: "cors" });
