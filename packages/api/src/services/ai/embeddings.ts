import { generateEmbedding } from "./ollama-client.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function buildEmbeddingContent(company: {
  name: string;
  category?: string | null;
  subcategory?: string | null;
  description?: string | null;
  address?: string | null;
  city?: string | null;
  analysis?: { summary?: string | null; fullAnalysis?: string | null } | null;
  score?: { scoreLabel?: string | null; totalScore?: unknown } | null;
}): string {
  const totalScore = company.score?.totalScore;
  const scoreNum = totalScore != null ? Number(totalScore) : null;
  return [
    company.name,
    company.category,
    company.subcategory,
    company.description,
    company.address,
    company.city,
    company.analysis?.summary,
    company.score?.scoreLabel && `Score: ${scoreNum}/100 - ${company.score.scoreLabel}`,
  ]
    .filter(Boolean)
    .join(" | ");
}

function simpleHash(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

export async function generateAndStoreEmbedding(companyId: number): Promise<void> {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: { analysis: true, score: true },
  });

  if (!company) throw new Error(`Company ${companyId} not found`);

  const content = buildEmbeddingContent(company);
  const contentHash = simpleHash(content);

  // Check existing embedding
  const existing = await prisma.$queryRawUnsafe<Array<{ content_hash: string }>>(
    'SELECT content_hash FROM "CompanyEmbedding" WHERE company_id = $1',
    companyId
  );

  if (existing.length > 0 && existing[0].content_hash === contentHash) {
    return;
  }

  const embedding = await generateEmbedding(content);
  const embeddingStr = JSON.stringify(embedding);

  if (existing.length > 0) {
    await prisma.$executeRawUnsafe(
      'UPDATE "CompanyEmbedding" SET embedding = $1::vector, content_hash = $2, created_at = NOW() WHERE company_id = $3',
      embeddingStr,
      contentHash,
      companyId
    );
  } else {
    await prisma.$executeRawUnsafe(
      'INSERT INTO "CompanyEmbedding" (company_id, embedding, content_hash, created_at) VALUES ($1, $2::vector, $3, NOW())',
      companyId,
      embeddingStr,
      contentHash
    );
  }
}

export async function generateEmbeddingsBatch(
  companyIds: number[]
): Promise<{ generated: number; skipped: number; errors: number }> {
  let generated = 0;
  let skipped = 0;
  let errors = 0;

  for (const id of companyIds) {
    try {
      const existing = await prisma.$queryRawUnsafe<Array<{ id: number }>>(
        'SELECT id FROM "CompanyEmbedding" WHERE company_id = $1',
        id
      );

      if (existing.length > 0) {
        skipped++;
        continue;
      }

      await generateAndStoreEmbedding(id);
      generated++;
    } catch (error) {
      console.error(`Error generating embedding for company ${id}:`, error);
      errors++;
    }
  }

  return { generated, skipped, errors };
}
