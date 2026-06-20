import { Queue, Worker, Job } from "bullmq";
import { PrismaClient } from "@prisma/client";
import { extractCompanyAttributes } from "../services/ai/analyzer.js";
import { calculateAffinityScore } from "../services/ai/scorer.js";
import { generateAndStoreEmbedding } from "../services/ai/embeddings.js";
import { chatCompletion } from "../services/ai/groq-client.js";

const prisma = new PrismaClient();

const connectionConfig = {
  host: "localhost",
  port: 6379,
  maxRetriesPerRequest: null,
};

export const analyzeQueue = new Queue("analyze", { connection: connectionConfig });

interface AnalyzeJobData {
  companyId: number;
  force?: boolean;
}

const JUSTIFICATION_PROMPT = `Eres un analista de alianzas comerciales de Ueno Bank (banco digital paraguayo).

Genera un párrafo conciso (3-5 oraciones) en español explicando por qué esta empresa es o no es una buena candidata para una alianza con Ueno.

El párrafo debe:
1. Mencionar el nombre de la empresa
2. Explicar los puntos fuertes para la alianza
3. Mencionar posibles debilidades
4. Dar una recomendación clara

Sé directo y profesional. Usa datos concretos cuando estén disponibles.`;

async function analyzeCompany(companyId: number): Promise<void> {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: { score: true, analysis: true },
  });

  if (!company) throw new Error(`Company ${companyId} not found`);

  console.log(`[AnalyzeWorker] Analyzing: ${company.name}`);

  // Step 1: Extract attributes
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

  console.log(`[AnalyzeWorker] Attributes extracted for: ${company.name}`);

  // Step 2: Calculate affinity score
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
    }
  );

  console.log(`[AnalyzeWorker] Score calculated for ${company.name}: ${scoreResult.totalScore}/100`);

  // Step 3: Generate justification
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

  console.log(`[AnalyzeWorker] Justification generated for: ${company.name}`);

  // Step 4: Save score
  await prisma.companyScore.upsert({
    where: { companyId },
    create: {
      companyId,
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
    },
    update: {
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
      calculatedAt: new Date(),
    },
  });

  // Step 5: Save analysis
  await prisma.companyAnalysis.upsert({
    where: { companyId },
    create: {
      companyId,
      summary: attributes.summary,
      strengths: [
        attributes.digitalStrength === "high" ? "Fuerte presencia digital" : null,
        attributes.localReputation === "high" ? "Buena reputación local" : null,
        attributes.hasPromotions ? "Ya tiene promociones activas" : null,
        attributes.acceptsCards ? "Acepta tarjetas de crédito" : null,
      ]
        .filter(Boolean)
        .join("; "),
      weaknesses: [
        attributes.digitalStrength === "low" ? "Débil presencia digital" : null,
        attributes.localReputation === "low" ? "Reputación baja o desconocida" : null,
        !attributes.physicalPresence ? "Sin presencia física" : null,
      ]
        .filter(Boolean)
        .join("; "),
      recommendation: justification,
      fullAnalysis: justification,
      modelUsed: "llama-3.3-70b-versatile",
    },
    update: {
      summary: attributes.summary,
      strengths: [
        attributes.digitalStrength === "high" ? "Fuerte presencia digital" : null,
        attributes.localReputation === "high" ? "Buena reputación local" : null,
        attributes.hasPromotions ? "Ya tiene promociones activas" : null,
        attributes.acceptsCards ? "Acepta tarjetas de crédito" : null,
      ]
        .filter(Boolean)
        .join("; "),
      weaknesses: [
        attributes.digitalStrength === "low" ? "Débil presencia digital" : null,
        attributes.localReputation === "low" ? "Reputación baja o desconocida" : null,
        !attributes.physicalPresence ? "Sin presencia física" : null,
      ]
        .filter(Boolean)
        .join("; "),
      recommendation: justification,
      fullAnalysis: justification,
      modelUsed: "llama-3.3-70b-versatile",
      createdAt: new Date(),
    },
  });

  // Step 6: Generate embedding (optional, can fail silently)
  try {
    await generateAndStoreEmbedding(companyId);
    console.log(`[AnalyzeWorker] Embedding generated for: ${company.name}`);
  } catch (error) {
    console.warn(`[AnalyzeWorker] Embedding skipped for ${company.name} (Ollama may not be running)`);
  }
}

// Worker
const analyzeWorker = new Worker(
  "analyze",
  async (job: Job<AnalyzeJobData>) => {
    const { companyId, force } = job.data;

    // Check if already analyzed (unless forced)
    if (!force) {
      const existing = await prisma.companyScore.findUnique({
        where: { companyId },
      });
      if (existing) {
        console.log(`[AnalyzeWorker] Company ${companyId} already analyzed, skipping`);
        return { skipped: true };
      }
    }

    await analyzeCompany(companyId);
    return { success: true };
  },
  {
    connection: connectionConfig,
    concurrency: 1,
  }
);

analyzeWorker.on("completed", (job) => {
  console.log(`[AnalyzeWorker] Job ${job.id} completed for company ${job.data.companyId}`);
});

analyzeWorker.on("failed", (job, err) => {
  console.error(`[AnalyzeWorker] Job ${job?.id} failed:`, err.message);
});

export { analyzeWorker };
