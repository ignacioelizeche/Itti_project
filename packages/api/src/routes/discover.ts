import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";
import { chatCompletion } from "../services/ai/llm-client.js";
import { searchPlaces } from "../services/scraper/google-places.js";
import { normalizeAndUpsert } from "../services/scraper/normalizer.js";
import { enrichCompany } from "../services/enrichment.js";
import { analyzeQueue } from "../services/ai/analysis-pipeline.js";
import { ASUNCION_COORDS } from "../services/scraper/directories.js";
import { DiscoverSchema } from "../schemas/index.js";
import { validateOrReply } from "../lib/validate.js";

const QUERY_GENERATION_PROMPT = (description: string) => `Sos un experto en marketing y negocios en Paraguay. Generá exactamente 3 consultas de búsqueda para Google Places basándote en esta descripción de lo que busca el usuario.

Descripción del usuario: "${description}"

Reglas:
- Las consultas deben ser en español
- Agregá siempre "en Asunción, Paraguay" al final
- Sé específico pero no redundante
- Cada consulta debe explorar un ángulo diferente
- Usá sinónimos y términos relacionados

Respondé SOLO con un JSON array de strings, sin nada más. Ejemplo:
["query1 en Asunción, Paraguay", "query2 en Asunción, Paraguay", "query3 en Asunción, Paraguay"]`;

export async function discoverRoutes(fastify: FastifyInstance) {
  // POST /api/discover - Intelligent search from natural language
  fastify.post("/", {
    schema: {
      tags: ["Discover"],
      summary: "Descubrir empresas con IA",
      description: "Describe en lenguaje natural qué tipo de empresa buscás. La IA genera consultas de búsqueda, encuentra empresas, las guarda y las analiza automáticamente.",
    },
  }, async (request, reply) => {
    const data = validateOrReply(DiscoverSchema, request.body, reply);
    if (!data) return;

    const { query, autoEnrich } = data;

    try {
      // 1. Generate search queries with AI
      const aiResponse = await chatCompletion([
        { role: "system", content: "Sos un experto en marketing y negocios en Paraguay. Respondé SOLO con un JSON array de strings." },
        { role: "user", content: QUERY_GENERATION_PROMPT(query) }
      ], { temperature: 0.3 });
      
      // Extract JSON array from response
      const jsonMatch = aiResponse.match(/\[[\s\S]*?\]/);
      if (!jsonMatch) {
        return reply.status(500).send({ error: "Could not generate search queries" });
      }

      const searchQueries: string[] = JSON.parse(jsonMatch[0]);
      console.log(`[Discover] Generated ${searchQueries.length} queries from: "${query}"`);

      // 2. Search Google Places for each query
      const allResults = [];
      const seenNames = new Set<string>();

      for (const searchQuery of searchQueries) {
        try {
          const results = await searchPlaces({
            query: searchQuery,
            locationBias: {
              latitude: ASUNCION_COORDS.latitude,
              longitude: ASUNCION_COORDS.longitude,
              radius: 15000,
            },
            maxResults: 20,
            languageCode: "es",
          });

          for (const place of results) {
            const normalizedName = place.name.toLowerCase().trim();
            if (!seenNames.has(normalizedName)) {
              seenNames.add(normalizedName);
              allResults.push({
                name: place.name,
                address: place.address,
                latitude: place.latitude,
                longitude: place.longitude,
                category: place.category,
                phone: place.phoneNumber,
                website: place.website,
                googleRating: place.googleRating,
                googleReviews: place.googleReviews,
                source: "discover",
              });
            }
          }
        } catch (err) {
          console.error(`[Discover] Error searching "${searchQuery}":`, err);
        }
      }

      console.log(`[Discover] Found ${allResults.length} unique results`);

      // 3. Save to database, enrich, and queue for analysis
      const saved = [];
      for (const place of allResults) {
        try {
          const result = await normalizeAndUpsert(prisma, place);
          const company = await prisma.company.findUnique({
            where: { id: result.id },
            include: { score: true },
          });
          if (company) {
            saved.push({ ...company, isNew: result.isNew });
            
            // Auto-enrich and analyze new companies
            if (autoEnrich && result.isNew) {
              enrichCompany(result.id).catch((err) => {
                console.error(`[Discover] Auto-enrich failed for ${place.name}:`, err);
              });
              // Queue for analysis
              analyzeQueue.add(`analyze-${result.id}`, { companyId: result.id }, {
                attempts: 2,
                backoff: { type: "exponential", delay: 5000 },
              }).catch((err) => {
                console.error(`[Discover] Failed to queue analysis for ${place.name}:`, err);
              });
            }
          }
        } catch (err) {
          console.error(`[Discover] Error saving "${place.name}":`, err);
        }
      }

      return {
        query,
        generatedQueries: searchQueries,
        totalFound: allResults.length,
        saved: saved.length,
        newCompanies: saved.filter((c) => c.isNew).length,
        companies: saved.map((c) => ({
          id: c.id,
          name: c.name,
          category: c.category,
          address: c.address,
          googleRating: c.googleRating,
          score: c.score?.totalScore,
          isNew: c.isNew,
        })),
      };
    } catch (error) {
      console.error("[Discover] Error:", error);
      return reply.status(500).send({ error: "Discovery failed" });
    }
  });
}
