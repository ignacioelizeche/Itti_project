import type { FastifyInstance } from "fastify";
import { prisma } from "../../lib/prisma.js";
import { enrichCompany } from "../../services/enrichment.js";
import { CompanyUpdateSchema } from "../../schemas/index.js";
import { validateOrReply } from "../../lib/validate.js";

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
      response: { 200: { type: "object" } },
    },
  }, async (request, reply) => {
    const { companyId } = request.params;

    const company = await prisma.company.findUnique({
      where: { id: parseInt(companyId) },
      include: {
        score: true,
        analysis: true,
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
    if (instagram !== undefined && instagram) {
      const cleanIg = instagram
        .replace(/^https?:\/\/(www\.)?instagram\.com\//, "")
        .replace("@", "")
        .split("/")[0]
        .trim();
      updateData.instagram = cleanIg || null;
    }
    if (facebook !== undefined && facebook) {
      const cleanFb = facebook
        .replace(/^https?:\/\/(www\.)?facebook\.com\//, "")
        .split("?")[0]
        .trim();
      updateData.facebook = cleanFb || null;
    }
    if (phone !== undefined) updateData.phone = phone || null;

    const updated = await prisma.company.update({
      where: { id: parseInt(companyId) },
      data: updateData,
    });

    const hasNewSocial = (instagram && updated.instagram) || (facebook && updated.facebook);
    if (hasNewSocial) {
      console.log(`[API] Auto-enriching ${updated.name} after contact update`);
      enrichCompany(updated.id).catch((err) =>
        console.error(`[API] Auto-enrich failed for ${updated.name}:`, err.message)
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
