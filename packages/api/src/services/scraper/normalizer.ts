import type { PrismaClient } from "@prisma/client";
import { logger } from "../../lib/logger.js";
import { slugify } from "../../utils/slug.js";

interface RawCompanyData {
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  category?: string;
  phone?: string;
  website?: string;
  googleRating?: number;
  googleReviews?: number;
  instagram?: string;
  facebook?: string;
  description?: string;
  source: string;
}

function normalizeCategory(rawCategory?: string): string {
  if (!rawCategory) return "Otros";

  const lower = rawCategory.toLowerCase();

  const categoryMap: Record<string, string[]> = {
    Restaurantes: ["restaurant", "food", "meal", "dining", "comida", "restaurante"],
    "Cafeterías": ["cafe", "coffee", "cafeteria", "café"],
    Tecnología: ["technology", "software", "tech", "computer", "tecnología"],
    Moda: ["fashion", "clothing", "apparel", "moda", "ropa"],
    Fitness: ["gym", "fitness", "sport", "exercise", "gimnasio"],
    Educación: ["education", "school", "university", "learning", "educación"],
    Salud: ["health", "medical", "hospital", "clinic", "salud", "médico"],
    Entretenimiento: ["entertainment", "movie", "theater", "event", "entretenimiento"],
    Supermercados: ["supermarket", "grocery", "store", "supermercado"],
    Belleza: ["beauty", "salon", "spa", "belleza", "salón"],
    Viajes: ["travel", "hotel", "lodging", "viaje", "hotel"],
    Hogar: ["home", "furniture", "home improvement", "hogar", "muebles"],
  };

  for (const [normalized, keywords] of Object.entries(categoryMap)) {
    if (keywords.some((k) => lower.includes(k))) {
      return normalized;
    }
  }

  return rawCategory;
}

function generateSlug(name: string, city: string): string {
  return slugify(`${name}-${city}`);
}

// Branch name patterns: " - ", "Suc.", "Sucursal", "Local"
const BRANCH_SEPARATORS = /\s+(?:-|Suc\.?|Sucursal|Local)\s+/i;

function extractBaseName(branchName: string): string | null {
  // Try splitting by common separators
  const parts = branchName.split(BRANCH_SEPARATORS);
  if (parts.length >= 2) {
    const base = parts[0].trim();
    // Only return if the base is meaningful (>3 chars)
    if (base.length > 3) return base;
  }
  return null;
}

async function findPotentialParent(
  prisma: PrismaClient,
  baseName: string,
  category: string | null,
  city: string
): Promise<{ id: number } | null> {
  // Search by normalized name (case-insensitive) in the same city
  const candidates = await prisma.company.findMany({
    where: {
      name: { equals: baseName, mode: "insensitive" },
      city,
      parentId: null, // Only link to root companies (not to other branches)
    },
    select: { id: true, category: true },
  });

  if (candidates.length === 0) return null;

  // Prefer exact category match
  if (category) {
    const match = candidates.find(
      (c) => c.category?.toLowerCase() === category.toLowerCase()
    );
    if (match) return match;
  }

  // Fall back to first candidate
  return candidates[0];
}

export async function normalizeAndUpsert(
  prisma: PrismaClient,
  data: RawCompanyData
): Promise<{ id: number; isNew: boolean }> {
  const name = data.name.trim();
  const city = "Asunción";
  const slug = generateSlug(name, city);

  // Check if company already exists by slug or name+city
  const existing = await prisma.company.findFirst({
    where: {
      OR: [{ slug }, { name: { equals: name, mode: "insensitive" }, city }],
    },
  });

  const normalizedCategory = normalizeCategory(data.category);

  if (existing) {
    // Update existing company with new data (only fill in missing fields)
    const updated = await prisma.company.update({
      where: { id: existing.id },
      data: {
        ...(data.address && !existing.address ? { address: data.address } : {}),
        ...(data.latitude && !existing.latitude ? { latitude: data.latitude } : {}),
        ...(data.longitude && !existing.longitude ? { longitude: data.longitude } : {}),
        ...(data.phone && !existing.phone ? { phone: data.phone } : {}),
        ...(data.website && !existing.website ? { website: data.website } : {}),
        ...(data.googleRating && !existing.googleRating
          ? { googleRating: data.googleRating }
          : {}),
        ...(data.googleReviews && !existing.googleReviews
          ? { googleReviews: data.googleReviews }
          : {}),
        ...(data.instagram && !existing.instagram ? { instagram: data.instagram } : {}),
        ...(data.facebook && !existing.facebook ? { facebook: data.facebook } : {}),
        ...(data.description && !existing.description
          ? { description: data.description }
          : {}),
        lastScrapedAt: new Date(),
        dataSources: JSON.parse(
          JSON.stringify({
            ...(existing.dataSources as Record<string, unknown>),
            [data.source]: new Date().toISOString(),
          })
        ),
      },
    });

    return { id: updated.id, isNew: false };
  }

  // Create new company
  const created = await prisma.company.create({
    data: {
      name,
      slug,
      category: normalizedCategory,
      address: data.address,
      latitude: data.latitude,
      longitude: data.longitude,
      city,
      country: "Paraguay",
      phone: data.phone,
      website: data.website,
      googleRating: data.googleRating,
      googleReviews: data.googleReviews,
      instagram: data.instagram,
      facebook: data.facebook,
      description: data.description,
      lastScrapedAt: new Date(),
      dataSources: { [data.source]: new Date().toISOString() },
    },
  });

  // Auto-detect chain: if name looks like a branch, link to parent
  const baseName = extractBaseName(name);
  if (baseName) {
    const parent = await findPotentialParent(prisma, baseName, data.category, city);
    if (parent) {
      await prisma.company.update({
        where: { id: created.id },
        data: { parentId: parent.id },
      });
      logger.info(`[Normalizer] Linked "${name}" as branch of "${baseName}" (id=${parent.id})`);
    }
  }

  return { id: created.id, isNew: true };
}

export async function normalizeBatch(
  prisma: PrismaClient,
  rawDataList: RawCompanyData[]
): Promise<{ created: number; updated: number; errors: number }> {
  let created = 0;
  let updated = 0;
  let errors = 0;

  for (const data of rawDataList) {
    try {
      const result = await normalizeAndUpsert(prisma, data);
      if (result.isNew) created++;
      else updated++;
    } catch (error) {
      logger.error(error, `Error normalizing "${data.name}"`);
      errors++;
    }
  }

  return { created, updated, errors };
}
