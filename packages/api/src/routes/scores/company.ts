import type { FastifyInstance } from "fastify";
import { prisma } from "../../lib/prisma.js";
import { logger } from "../../lib/logger.js";
import { enrichCompany } from "../../services/enrichment.js";
import { CompanyUpdateSchema } from "../../schemas/index.js";
import { validateOrReply } from "../../lib/validate.js";
import { cleanInstagram, cleanFacebook } from "../../utils/social.js";

export async function companyRoutes(fastify: FastifyInstance) {
  // GET /api/scores/company/:companyId - Get company with all data
  fastify.get<{
    Params: { companyId: string };
  }>("/company/:companyId", {
    schema: {
      tags: ["Scoring"],
      summary: "Obtener empresa con datos completos",
      params: {
        type: "object",
        properties: { companyId: { type: "string" } },
      },
    },
  }, async (request, reply) => {
    const { companyId } = request.params;

    const company = await prisma.company.findUnique({
      where: { id: parseInt(companyId) },
      include: {
        score: true,
        analysis: true,
        parent: {
          select: { id: true, name: true, slug: true, category: true },
        },
        branches: {
          select: { id: true, name: true, slug: true, address: true, category: true, city: true },
          orderBy: { name: "asc" },
        },
      },
    });

    if (!company) {
      return reply.status(404).send({ error: "Company not found" });
    }

    return {
      ...company,
      createdAt: company.createdAt?.toISOString(),
      updatedAt: company.updatedAt?.toISOString(),
      lastScrapedAt: company.lastScrapedAt?.toISOString(),
    };
  });

  // GET /api/scores/company/:companyId/suggestions - Find potential chain matches
  fastify.get<{
    Params: { companyId: string };
  }>("/company/:companyId/suggestions", {
    schema: {
      tags: ["Scoring"],
      summary: "Buscar posibles sucursales hermanas",
      params: {
        type: "object",
        properties: { companyId: { type: "string" } },
      },
    },
  }, async (request, reply) => {
    const { companyId } = request.params;
    const id = parseInt(companyId);

    const company = await prisma.company.findUnique({
      where: { id },
      select: { name: true, category: true, city: true, parentId: true },
    });

    if (!company) {
      return reply.status(404).send({ error: "Company not found" });
    }

    // If this company has a parent, suggest siblings (other branches of same parent)
    if (company.parentId) {
      const siblings = await prisma.company.findMany({
        where: {
          parentId: company.parentId,
          id: { not: id },
        },
        select: { id: true, name: true, address: true, category: true, city: true },
        orderBy: { name: "asc" },
      });
      return { suggestions: siblings, type: "siblings" };
    }

    // Otherwise, find companies that could be parent or child branches
    const candidates = await prisma.company.findMany({
      where: {
        id: { not: id },
        parentId: null, // Only root companies
        OR: [
          // Same category companies
          company.category ? { category: company.category } : {},
          // Companies whose name is contained in this one or vice versa
          { name: { contains: company.name, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, address: true, category: true, city: true },
      orderBy: { name: "asc" },
      take: 20,
    });

    // Calculate simple similarity score based on name overlap
    const scored = candidates.map((c) => {
      const a = company.name.toLowerCase();
      const b = c.name.toLowerCase();
      const similarity = a === b ? 1
        : a.startsWith(b) || b.startsWith(a) ? 0.8
        : a.includes(b) || b.includes(a) ? 0.6
        : 0.3;
      return { ...c, similarity };
    }).sort((a, b) => b.similarity - a.similarity);

    return { suggestions: scored, type: "candidates" };
  });

  // POST /api/scores/company/:companyId/link - Link/unlink branches
  fastify.post<{
    Params: { companyId: string };
    Body: { action: "link" | "unlink"; targetId: number };
  }>("/company/:companyId/link", {
    schema: {
      tags: ["Scoring"],
      summary: "Vincular o desvincular sucursales",
      params: {
        type: "object",
        properties: { companyId: { type: "string" } },
      },
      body: {
        type: "object",
        properties: {
          action: { type: "string", enum: ["link", "unlink"] },
          targetId: { type: "number" },
        },
        required: ["action", "targetId"],
      },
    },
  }, async (request, reply) => {
    const { companyId } = request.params;
    const { action, targetId } = request.body;
    const id = parseInt(companyId);

    if (id === targetId) {
      return reply.status(400).send({ error: "Cannot link company to itself" });
    }

    const [company, target] = await Promise.all([
      prisma.company.findUnique({ where: { id }, select: { id: true, name: true } }),
      prisma.company.findUnique({ where: { id: targetId }, select: { id: true, name: true } }),
    ]);

    if (!company || !target) {
      return reply.status(404).send({ error: "Company not found" });
    }

    if (action === "link") {
      // Link target as branch of company (company becomes parent)
      await prisma.company.update({
        where: { id: targetId },
        data: { parentId: id },
      });
      logger.info(`[API] Linked "${target.name}" as branch of "${company.name}"`);
      return { message: `"${target.name}" vinculada como sucursal de "${company.name}"` };
    } else {
      // Unlink - remove parent from target
      await prisma.company.update({
        where: { id: targetId },
        data: { parentId: null },
      });
      logger.info(`[API] Unlinked "${target.name}" from "${company.name}"`);
      return { message: `"${target.name}" desvinculada de "${company.name}"` };
    }
  });

  // PATCH /api/scores/company/:companyId - Update company data
  fastify.patch<{
    Params: { companyId: string };
  }>("/company/:companyId", async (request, reply) => {
    const { companyId } = request.params;

    const data = validateOrReply(CompanyUpdateSchema, request.body, reply);
    if (!data) return;

    const { website, instagram, facebook, phone } = data;

    const company = await prisma.company.findUnique({
      where: { id: parseInt(companyId) },
    });

    if (!company) {
      return reply.status(404).send({ error: "Company not found" });
    }

    const updateData: Record<string, any> = {};
    if (website !== undefined) updateData.website = website || null;
    if (instagram !== undefined) updateData.instagram = cleanInstagram(instagram) ?? null;
    if (facebook !== undefined) updateData.facebook = cleanFacebook(facebook) ?? null;
    if (phone !== undefined) updateData.phone = phone || null;

    const updated = await prisma.company.update({
      where: { id: parseInt(companyId) },
      data: updateData,
    });

    const hasNewSocial = (instagram && updated.instagram) || (facebook && updated.facebook);
    if (hasNewSocial) {
      logger.info(`[API] Auto-enriching ${updated.name} after contact update`);
      enrichCompany(updated.id).catch((err) =>
        logger.error(err, `[API] Auto-enrich failed for ${updated.name}`)
      );
    }

    return {
      message: hasNewSocial
        ? "Datos actualizados. Enriqueciendo redes sociales..."
        : "Datos actualizados",
      company: {
        id: updated.id,
        name: updated.name,
        website: updated.website,
        instagram: updated.instagram,
        facebook: updated.facebook,
        phone: updated.phone,
      },
    };
  });
}
