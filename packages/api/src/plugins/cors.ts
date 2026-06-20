import cors from "@fastify/cors";
import type { FastifyInstance } from "fastify";
import fastifyPlugin from "fastify-plugin";

async function corsPlugin(fastify: FastifyInstance) {
  await fastify.register(cors, {
    origin: process.env.NODE_ENV === "production" ? false : true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  });
}

export default fastifyPlugin(corsPlugin, { name: "cors" });
