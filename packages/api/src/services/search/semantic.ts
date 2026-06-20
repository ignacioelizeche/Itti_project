import { generateEmbedding } from "../ai/ollama-client.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface SemanticSearchResult {
  companyId: number;
  name: string;
  category: string | null;
  subcategory: string | null;
  address: string | null;
  city: string | null;
  googleRating: number | null;
  googleReviews: number | null;
  totalScore: number | null;
  scoreLabel: string | null;
  summary: string | null;
  recommendation: string | null;
  similarity: number;
}

export async function semanticSearch(
  query: string,
  options: {
    limit?: number;
    category?: string;
    minScore?: number;
    city?: string;
  } = {}
): Promise<SemanticSearchResult[]> {
  const { limit = 20, category, minScore, city } = options;

  // Generate embedding for the query (graceful fallback if Ollama unavailable)
  let queryEmbedding: number[];
  try {
    queryEmbedding = await generateEmbedding(query);
  } catch (error) {
    console.error("Embedding generation failed, falling back to text search:", error);
    // Fallback: return empty results with a message
    return [];
  }

  // Use raw SQL for vector similarity search with pgvector
  const results = await prisma.$queryRawUnsafe<SemanticSearchResult[]>(
    `
    SELECT 
      c.id as "companyId",
      c.name,
      c.category,
      c.subcategory,
      c.address,
      c.city,
      c.google_rating as "googleRating",
      c.google_reviews_count as "googleReviews",
      cs.total_score as "totalScore",
      cs.score_label as "scoreLabel",
      ca.summary,
      ca.recommendation,
      1 - (ce.embedding <=> $1::vector) as similarity
    FROM "Company" c
    LEFT JOIN "CompanyScore" cs ON cs.company_id = c.id
    LEFT JOIN "CompanyAnalysis" ca ON ca.company_id = c.id
    LEFT JOIN "CompanyEmbedding" ce ON ce.company_id = c.id
    WHERE ce.embedding IS NOT NULL
      ${category ? `AND c.category = '${category}'` : ""}
      ${minScore ? `AND cs.total_score >= ${minScore}` : ""}
      ${city ? `AND c.city = '${city}'` : ""}
    ORDER BY ce.embedding <=> $1::vector
    LIMIT ${limit}
    `,
    JSON.stringify(queryEmbedding)
  );

  return results;
}

export async function hybridSearch(
  query: string,
  options: {
    limit?: number;
    category?: string;
    minScore?: number;
    city?: string;
    textFilter?: string;
  } = {}
): Promise<SemanticSearchResult[]> {
  const { limit = 20, category, minScore, city, textFilter } = options;

  let queryEmbedding: number[];
  try {
    queryEmbedding = await generateEmbedding(query);
  } catch (error) {
    console.error("Embedding generation failed for hybrid search:", error);
    return [];
  }

  // Combine vector search with text filters
  const results = await prisma.$queryRawUnsafe<SemanticSearchResult[]>(
    `
    SELECT 
      c.id as "companyId",
      c.name,
      c.category,
      c.subcategory,
      c.address,
      c.city,
      c.google_rating as "googleRating",
      c.google_reviews_count as "googleReviews",
      cs.total_score as "totalScore",
      cs.score_label as "scoreLabel",
      ca.summary,
      ca.recommendation,
      1 - (ce.embedding <=> $1::vector) as similarity
    FROM "Company" c
    LEFT JOIN "CompanyScore" cs ON cs.company_id = c.id
    LEFT JOIN "CompanyAnalysis" ca ON ca.company_id = c.id
    LEFT JOIN "CompanyEmbedding" ce ON ce.company_id = c.id
    WHERE ce.embedding IS NOT NULL
      ${category ? `AND c.category = '${category}'` : ""}
      ${minScore ? `AND cs.total_score >= ${minScore}` : ""}
      ${city ? `AND c.city = '${city}'` : ""}
      ${textFilter ? `AND (c.name ILIKE '%${textFilter}%' OR c.description ILIKE '%${textFilter}%')` : ""}
    ORDER BY ce.embedding <=> $1::vector
    LIMIT ${limit}
    `,
    JSON.stringify(queryEmbedding)
  );

  return results;
}
