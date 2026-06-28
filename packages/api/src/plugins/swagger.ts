import type { FastifyInstance } from "fastify";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";

export async function swaggerPlugin(fastify: FastifyInstance) {
  await fastify.register(swagger, {
    openapi: {
      info: {
        title: "Buscador de Alianzas Ueno Bank",
        description: "API para descubrir, analizar y evaluar alianzas comerciales potenciales usando IA",
        version: "1.0.0",
      },
      servers: [
        { url: "http://localhost:3001", description: "Desarrollo" },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "apiKey",
            in: "header",
            name: "Authorization",
          },
        },
      },
      tags: [
        { name: "Discover", description: "Búsqueda inteligente con IA" },
        { name: "Search", description: "Búsqueda semántica e híbrida" },
        { name: "Companies", description: "CRUD de empresas" },
        { name: "Scoring", description: "Análisis y scoring de empresas" },
        { name: "Decisions", description: "Decisiones de alianzas" },
        { name: "Scrape", description: "Recolección de datos" },
        { name: "Enrichment", description: " Enriquecimiento de datos" },
        { name: "Health", description: "Estado del sistema" },
      ],
    },
  });

  await fastify.register(swaggerUi, {
    routePrefix: "/docs",
    uiConfig: {
      deepLinking: true,
      docExpansion: "list",
      filter: true,
    },
  });
}
