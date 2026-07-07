import { generateEmbedding } from "./llm-client.js";
import { prisma } from "../../lib/prisma.js";

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

import { createHash } from "crypto";

function contentHash(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

export async function generateAndStoreEmbedding(companyId: number): Promise<void> {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: { analysis: true, score: true },
  });

  if (!company) throw new Error(`Company ${companyId} not found`);

  const content = buildEmbeddingContent(company);
  const hash = contentHash(content);

  // Check existing embedding
  const existing = await prisma.$queryRawUnsafe<Array<{ content_hash: string }>>(
    'SELECT content_hash FROM "CompanyEmbedding" WHERE company_id = $1',
    companyId
  );

  if (existing.length > 0 && existing[0].content_hash === hash) {
    return;
  }

  const embedding = await generateEmbedding(content);
  const embeddingStr = JSON.stringify(embedding);

  if (existing.length > 0) {
    await prisma.$executeRawUnsafe(
      'UPDATE "CompanyEmbedding" SET embedding = $1::vector, content_hash = $2, created_at = NOW() WHERE company_id = $3',
      embeddingStr,
      hash,
      companyId
    );
  } else {
    await prisma.$executeRawUnsafe(
      'INSERT INTO "CompanyEmbedding" (company_id, embedding, content_hash, created_at) VALUES ($1, $2::vector, $3, NOW())',
      companyId,
      embeddingStr,
      hash
    );
  }
}

