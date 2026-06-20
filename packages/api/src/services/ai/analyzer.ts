import { chatCompletionJSON } from "./groq-client.js";

interface CompanyAttributes {
  industry: string;
  targetAudience: string;
  brandTone: string;
  estimatedSize: "small" | "medium" | "large";
  digitalStrength: "low" | "medium" | "high";
  localReputation: "low" | "medium" | "high";
  hasPromotions: boolean;
  acceptsCards: boolean;
  physicalPresence: boolean;
  onlinePresence: boolean;
  summary: string;
}

const EXTRACTION_PROMPT = `Eres un analista de negocios especializado en el mercado paraguayo. Tu tarea es analizar información pública de una empresa y extraer atributos clave para evaluar su potencial como aliada comercial de Ueno Bank (banco digital de Paraguay).

CONTEXTO SOBRE UENO BANK:
- Ueno es un banco digital paraguayo
- Su público principal son jóvenes urbanos (18-35 años), tecnológicos
- Ofrece beneficios como descuentos, cashback, recompensas (ŭpys), financiación
- Las alianzas suelen ser: descuentos por pago con Ueno, reintegros, cuotas sin intereses

INSTRUCCIONES:
Analiza la información de la empresa y devuelve un JSON con los siguientes campos:

{
  "industry": "rubro principal de la empresa",
  "targetAudience": "público objetivo descriptivo (ej: 'jóvenes 18-30, universitarios, clase media')",
  "brandTone": "tono de marca (ej: 'formal', 'casual', 'juvenil', 'familiar', 'premium')",
  "estimatedSize": "small|medium|large",
  "digitalStrength": "low|medium|high",
  "localReputation": "low|medium|high",
  "hasPromotions": true/false,
  "acceptsCards": true/false,
  "physicalPresence": true/false,
  "onlinePresence": true/false,
  "summary": "resumen de 2-3 oraciones sobre la empresa y su relevancia potencial"
}`;

export async function extractCompanyAttributes(
  companyName: string,
  rawData: {
    category?: string;
    subcategory?: string;
    description?: string;
    address?: string;
    googleRating?: number;
    googleReviews?: number;
    website?: string;
    instagram?: string;
    instagramFollowers?: number | null;
    facebook?: string;
    allianceStatus?: string;
    allianceDetails?: Record<string, unknown>;
    dataSources?: Record<string, unknown>;
  }
): Promise<CompanyAttributes> {
  const dataSources = rawData.dataSources as Record<string, any> || {};

  const dataContext = [
    `Empresa: ${companyName}`,
    rawData.category && `Categoría: ${rawData.category}`,
    rawData.subcategory && `Subcategoría: ${rawData.subcategory}`,
    rawData.description && `Descripción: ${rawData.description}`,
    rawData.address && `Dirección: ${rawData.address}`,
    rawData.googleRating && `Rating Google: ${rawData.googleRating}/5 (${rawData.googleReviews || 0} reseñas)`,
    rawData.website && `Sitio web: ${rawData.website}`,
    rawData.instagram && `Instagram: @${rawData.instagram}`,
    rawData.instagramFollowers && `Instagram seguidores: ${rawData.instagramFollowers}`,
    rawData.facebook && `Facebook: ${rawData.facebook}`,
    dataSources.facebook?.followers && `Facebook seguidores: ${dataSources.facebook.followers}`,
    dataSources.facebook?.rating && `Facebook rating: ${dataSources.facebook.rating}/5`,
    dataSources.similarweb?.monthlyVisits && `Tráfico web mensual estimado: ${dataSources.similarweb.monthlyVisits}`,
    dataSources.similarweb?.bounceRate && `Tasa de rebote web: ${Math.round(dataSources.similarweb.bounceRate * 100)}%`,
    rawData.allianceStatus === "active" && "Estado: ALIANZA ACTIVA de Ueno+",
    rawData.allianceDetails?.benefit && `Beneficio actual: ${rawData.allianceDetails.benefit}`,
  ]
    .filter(Boolean)
    .join("\n");

  const messages = [
    { role: "system" as const, content: EXTRACTION_PROMPT },
    {
      role: "user" as const,
      content: `Analiza esta empresa:\n\n${dataContext}\n\nDevuelve el JSON con los atributos.`,
    },
  ];

  return chatCompletionJSON<CompanyAttributes>(messages, {
    temperature: 0.2,
    maxTokens: 1024,
  });
}
