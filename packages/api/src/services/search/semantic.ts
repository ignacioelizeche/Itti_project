import { generateEmbedding } from "../ai/llm-client.js";
import { prisma } from "../../lib/prisma.js";

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
    textFilter?: string;
  } = {}
): Promise<SemanticSearchResult[]> {
  const { limit = 20, category, minScore, city, textFilter } = options;

  let queryEmbedding: number[];
  try {
    queryEmbedding = await generateEmbedding(query);
  } catch (error) {
    console.error("Embedding generation failed, falling back to text search:", error);
    return [];
  }

  const conditions: string[] = ["ce.embedding IS NOT NULL"];
  const params: unknown[] = [JSON.stringify(queryEmbedding)];
  let paramIndex = 2;

  if (category) {
    conditions.push(`c.category = $${paramIndex}`);
    params.push(category);
    paramIndex++;
  }

  if (minScore) {
    conditions.push(`cs.total_score >= $${paramIndex}`);
    params.push(minScore);
    paramIndex++;
  }

  if (city) {
    conditions.push(`c.city = $${paramIndex}`);
    params.push(city);
    paramIndex++;
  }

  if (textFilter) {
    conditions.push(`(c.name ILIKE $${paramIndex} OR c.description ILIKE $${paramIndex})`);
    params.push(`%${textFilter}%`);
    paramIndex++;
  }

  const whereClause = conditions.join(" AND ");

  const sql = `
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
    WHERE ${whereClause}
    ORDER BY ce.embedding <=> $1::vector
    LIMIT $${paramIndex}
  `;

  params.push(limit);

  const results = await prisma.$queryRawUnsafe<SemanticSearchResult[]>(sql, ...params);

  return results;
}
