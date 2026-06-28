import { Queue } from "bullmq";
import { prisma } from "../../lib/prisma.js";
import { extractCompanyAttributes } from "./analyzer.js";
import { calculateAffinityScore } from "./scorer.js";
import { generateAndStoreEmbedding } from "./embeddings.js";
import { chatCompletion } from "./llm-client.js";
import { enrichCompany } from "../enrichment.js";
import { getQueueConnection } from "../../lib/queue.js";

const connectionConfig = getQueueConnection();

export const analyzeQueue = new Queue("analyze", { connection: connectionConfig });

const JUSTIFICATION_PROMPT = `Eres un analista de alianzas comerciales de Ueno Bank (banco digital paraguayo).

Genera un párrafo conciso (3-5 oraciones) en español explicando por qué esta empresa es o no es una buena candidata para una alianza con Ueno.

El párrafo debe:
1. Mencionar el nombre de la empresa
2. Explicar los puntos fuertes para la alianza
3. Mencionar posibles debilidades
4. Dar una recomendación clara

Sé directo y profesional. Usa datos concretos cuando estén disponibles.`;

function buildStrengths(attrs: { digitalStrength: string; localReputation: string; hasPromotions: boolean; acceptsCards: boolean }): string {
  return [
    attrs.digitalStrength === "high" ? "Fuerte presencia digital" : null,
    attrs.localReputation === "high" ? "Buena reputación local" : null,
    attrs.hasPromotions ? "Ya tiene promociones activas" : null,
    attrs.acceptsCards ? "Acepta tarjetas de crédito" : null,
  ]
    .filter(Boolean)
    .join("; ");
}

function buildWeaknesses(attrs: { digitalStrength: string; localReputation: string; physicalPresence: boolean }): string {
  return [
    attrs.digitalStrength === "low" ? "Débil presencia digital" : null,
    attrs.localReputation === "low" ? "Reputación baja o desconocida" : null,
    !attrs.physicalPresence ? "Sin presencia física" : null,
  ]
    .filter(Boolean)
    .join("; ");
}

export async function analyzeCompany(companyId: number): Promise<void> {
  let company = await prisma.company.findUnique({
    where: { id: companyId },
    include: { score: true, analysis: true },
  });

  if (!company) throw new Error(`Company ${companyId} not found`);

  console.log(`[AnalyzeWorker] Analyzing: ${company.name}`);

  if (!company.instagramFollowers && !company.lastScrapedAt) {
    console.log(`[AnalyzeWorker] Auto-enriching ${company.name} before analysis...`);
    try {
      await enrichCompany(companyId);
      const reloaded = await prisma.company.findUnique({
        where: { id: companyId },
        include: { score: true, analysis: true },
      });
      if (reloaded) company = reloaded;
    } catch (err) {
      console.warn(`[AnalyzeWorker] Enrichment failed for ${company.name}, continuing with analysis`);
    }
  }

  const attributes = await extractCompanyAttributes(company.name, {
    category: company.category ?? undefined,
    subcategory: company.subcategory ?? undefined,
    description: company.description ?? undefined,
    address: company.address ?? undefined,
    googleRating: company.googleRating ? Number(company.googleRating) : undefined,
    googleReviews: company.googleReviews ?? undefined,
    website: company.website ?? undefined,
    instagram: company.instagram ?? undefined,
    instagramFollowers: company.instagramFollowers ?? undefined,
    facebook: company.facebook ?? undefined,
    allianceStatus: company.allianceStatus ?? undefined,
    allianceDetails: (company.allianceDetails as Record<string, unknown>) ?? undefined,
    dataSources: (company.dataSources as Record<string, unknown>) ?? undefined,
  });

  const scoreResult = await calculateAffinityScore(
    company.name,
    attributes,
    {
      category: company.category ?? undefined,
      googleRating: company.googleRating ? Number(company.googleRating) : undefined,
      googleReviews: company.googleReviews ?? undefined,
      city: company.city ?? undefined,
      allianceStatus: company.allianceStatus ?? undefined,
      allianceDetails: (company.allianceDetails as Record<string, unknown>) ?? undefined,
      instagramFollowers: company.instagramFollowers ?? undefined,
      dataSources: (company.dataSources as Record<string, unknown>) ?? undefined,
    }
  );

  const justificationMessages = [
    { role: "system" as const, content: JUSTIFICATION_PROMPT },
    {
      role: "user" as const,
      content: `Empresa: ${company.name}
Categoría: ${company.category} - ${company.subcategory || "N/A"}
Ubicación: ${company.city}, Paraguay
Público objetivo: ${attributes.targetAudience}
Tamaño: ${attributes.estimatedSize}
Fuerza digital: ${attributes.digitalStrength}
Reputación: ${attributes.localReputation}
Score de afinidad: ${scoreResult.totalScore}/100 (${scoreResult.scoreLabel})
Desglose: Audiencia ${scoreResult.scores.audienceOverlap}, Compatibilidad ${scoreResult.scores.ittiCompatibility}, Digital ${scoreResult.scores.digitalPresence}, Reputación ${scoreResult.scores.reputation}
${company.allianceStatus === "active" ? "ESTA EMPRESA YA ES ALIADO ACTIVO DE UENO+" : ""}
Resumen: ${attributes.summary}

Genera el párrafo de justificación.`,
    },
  ];

  const justification = await chatCompletion(justificationMessages, {
    temperature: 0.3,
    maxTokens: 512,
  });

  const scoreFields = {
    categoryFit: scoreResult.scores.categoryFit,
    locationFit: scoreResult.scores.locationFit,
    audienceOverlap: scoreResult.scores.audienceOverlap,
    businessSize: scoreResult.scores.businessSize,
    digitalPresence: scoreResult.scores.digitalPresence,
    reputation: scoreResult.scores.reputation,
    ittiCompatibility: scoreResult.scores.ittiCompatibility,
    alliancePotential: scoreResult.scores.alliancePotential,
    totalScore: scoreResult.totalScore,
    scoreLabel: scoreResult.scoreLabel,
  };

  await prisma.companyScore.upsert({
    where: { companyId },
    create: { companyId, ...scoreFields },
    update: { ...scoreFields, calculatedAt: new Date() },
  });

  const analysisFields = {
    summary: attributes.summary,
    strengths: buildStrengths(attributes),
    weaknesses: buildWeaknesses(attributes),
    recommendation: justification,
    fullAnalysis: justification,
    modelUsed: "llama3.1:8b (Ollama local)",
  };

  await prisma.companyAnalysis.upsert({
    where: { companyId },
    create: { companyId, ...analysisFields },
    update: { ...analysisFields, createdAt: new Date() },
  });

  try {
    await generateAndStoreEmbedding(companyId);
  } catch {
    console.warn(`[AnalyzeWorker] Embedding skipped for ${company.name} (Ollama may not be running)`);
  }
}
