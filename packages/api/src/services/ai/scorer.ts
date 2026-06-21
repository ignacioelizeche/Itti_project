import { chatCompletionJSON } from "./llm-client.js";

interface ScoreBreakdown {
  categoryFit: number;
  locationFit: number;
  audienceOverlap: number;
  businessSize: number;
  digitalPresence: number;
  reputation: number;
  ittiCompatibility: number;
  alliancePotential: number;
}

interface ScoreResult {
  scores: ScoreBreakdown;
  totalScore: number;
  scoreLabel: string;
}

const SCORE_WEIGHTS = {
  categoryFit: 0.10,
  locationFit: 0.08,
  audienceOverlap: 0.25,
  businessSize: 0.05,
  digitalPresence: 0.15,
  reputation: 0.12,
  ittiCompatibility: 0.20,
  alliancePotential: 0.05,
};

function getScoreLabel(total: number): string {
  if (total >= 85) return "Muy recomendable";
  if (total >= 70) return "Buena candidata";
  if (total >= 50) return "Moderada";
  return "Baja afinidad";
}

const SCORING_PROMPT = `Eres un analista de alianzas comerciales de Ueno Bank (banco digital paraguayo de Paraguay).

CONTEXTO:
- Ueno Bank es un banco digital con público mayoritariamente joven (18-35 años), urbano, tecnológico
- Las alianzas buscan ofrecer beneficios a usuarios: descuentos, cashback, recompensas (ŭpys), cuotas sin intereses
- Categorías de interés: gastronomía, moda, deportes, entretenimiento, supermercados, tecnología, bienestar

PESOS DE EVALUACIÓN:
- Audiencia (25%): Que el público objetivo coincida con usuarios de Ueno (jóvenes, urbanos, digitales)
- Compatibilidad Ueno (20%): Que pueda ofrecer beneficios tangibles (descuentos, cashback, etc.)
- Presencia digital (15%): Fuerte presencia en redes = más visibilidad para promociones
- Reputación (12%): Ratings y reseñas altas = confianza
- Rubro (10%): Que el sector sea relevante para el estilo de vida Ueno
- Ubicación (8%): Zonas de alta concentración de usuarios
- Tamaño (5%): Empresas con capacidad para ejecutar alianzas
- Potencial de alianza (5%): Si YA ES ALIADO ACTIVO de Ueno+, dar 90-100. Si tiene historial de alianzas con otras marcas, dar 70-89. Si no tiene historial pero parece receptivo, dar 50-69. Si no muestra interés, dar 0-49.

INSTRUCCIONES:
Evalúa cada criterio del 0 al 100 y calcula el score total ponderado.

IMPORTANTE: Si la empresa tiene alliance_status = "active", ES UNA ALIADO ACTIVA y debe tener alliancePotential de 90-100.

Devuelve un JSON:
{
  "scores": {
    "categoryFit": 0-100,
    "locationFit": 0-100,
    "audienceOverlap": 0-100,
    "businessSize": 0-100,
    "digitalPresence": 0-100,
    "reputation": 0-100,
    "ittiCompatibility": 0-100,
    "alliancePotential": 0-100
  },
  "reasoning": "explicación breve de los scores"
}`;

export async function calculateAffinityScore(
  companyName: string,
  attributes: {
    industry: string;
    targetAudience: string;
    brandTone: string;
    estimatedSize: string;
    digitalStrength: string;
    localReputation: string;
    hasPromotions: boolean;
    acceptsCards: boolean;
    physicalPresence: boolean;
    onlinePresence: boolean;
    summary: string;
  },
  rawData: {
    category?: string;
    googleRating?: number;
    googleReviews?: number;
    city?: string;
    allianceStatus?: string;
    allianceDetails?: Record<string, unknown>;
    instagramFollowers?: number | null;
    dataSources?: Record<string, unknown>;
  }
): Promise<ScoreResult> {
  const ds = (rawData.dataSources as Record<string, any>) || {};

  const dataContext = [
    `Empresa: ${companyName}`,
    `Rubro: ${attributes.industry}`,
    `Público objetivo: ${attributes.targetAudience}`,
    `Tono de marca: ${attributes.brandTone}`,
    `Tamaño estimado: ${attributes.estimatedSize}`,
    `Fuerza digital: ${attributes.digitalStrength}`,
    `Reputación local: ${attributes.localReputation}`,
    `Tiene promociones: ${attributes.hasPromotions ? "Sí" : "No"}`,
    `Acepta tarjetas: ${attributes.acceptsCards ? "Sí" : "No"}`,
    `Presencia física: ${attributes.physicalPresence ? "Sí" : "No"}`,
    `Presencia online: ${attributes.onlinePresence ? "Sí" : "No"}`,
    rawData.category && `Categoría: ${rawData.category}`,
    rawData.googleRating && `Rating Google: ${rawData.googleRating}/5 (${rawData.googleReviews || 0} reseñas)`,
    rawData.city && `Ubicación: ${rawData.city}, Paraguay`,
    rawData.allianceStatus === "active" && "⚠️ Ya es aliado activo de Ueno+",
    rawData.allianceDetails?.benefit && `Beneficio actual: ${rawData.allianceDetails.benefit}`,
    rawData.instagramFollowers && `Instagram seguidores: ${rawData.instagramFollowers}`,
    ds.instagram?.engagementRate && `Instagram engagement rate: ${ds.instagram.engagementRate}%`,
    ds.instagram?.avgLikes && `Instagram likes promedio: ${ds.instagram.avgLikes}`,
    ds.instagram?.avgComments && `Instagram comentarios promedio: ${ds.instagram.avgComments}`,
    ds.instagram?.biography && `Instagram bio: ${ds.instagram.biography}`,
    ds.facebook?.followers && `Facebook seguidores: ${ds.facebook.followers}`,
    ds.facebook?.rating && `Facebook rating: ${ds.facebook.rating}/5`,
    ds.similarweb?.monthlyVisits && `Tráfico web mensual estimado: ${ds.similarweb.monthlyVisits}`,
    ds.similarweb?.bounceRate && `Tasa de rebote web: ${Math.round(ds.similarweb.bounceRate * 100)}%`,
    `Resumen: ${attributes.summary}`,
  ]
    .filter(Boolean)
    .join("\n");

  const messages = [
    { role: "system" as const, content: SCORING_PROMPT },
    {
      role: "user" as const,
      content: `Evalúa esta empresa:\n\n${dataContext}\n\nDevuelve el JSON con los scores.`,
    },
  ];

  const result = await chatCompletionJSON<{
    scores: ScoreBreakdown;
    reasoning: string;
  }>(messages, {
    temperature: 0.2,
    maxTokens: 1024,
  });

  // Calculate weighted total
  const totalScore = Math.round(
    result.scores.categoryFit * SCORE_WEIGHTS.categoryFit +
    result.scores.locationFit * SCORE_WEIGHTS.locationFit +
    result.scores.audienceOverlap * SCORE_WEIGHTS.audienceOverlap +
    result.scores.businessSize * SCORE_WEIGHTS.businessSize +
    result.scores.digitalPresence * SCORE_WEIGHTS.digitalPresence +
    result.scores.reputation * SCORE_WEIGHTS.reputation +
    result.scores.ittiCompatibility * SCORE_WEIGHTS.ittiCompatibility +
    result.scores.alliancePotential * SCORE_WEIGHTS.alliancePotential
  );

  return {
    scores: result.scores,
    totalScore: Math.min(100, Math.max(0, totalScore)),
    scoreLabel: getScoreLabel(totalScore),
  };
}
