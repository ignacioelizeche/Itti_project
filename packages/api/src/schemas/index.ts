import { z } from "zod";

export const DiscoverSchema = z.object({
  query: z.string().min(3, "Query must be at least 3 characters"),
  autoEnrich: z.boolean().optional().default(true),
});

export const SearchSchema = z.object({
  query: z.string().min(1, "Query is required"),
  limit: z.number().int().min(1).max(100).optional().default(20),
  category: z.string().optional(),
  minScore: z.number().min(0).max(100).optional(),
  city: z.string().optional(),
});

export const HybridSearchSchema = SearchSchema.extend({
  textFilter: z.string().optional(),
});

export const AnalyzeSchema = z.object({
  force: z.boolean().optional().default(false),
});

export const AnalyzeBatchSchema = z.object({
  category: z.string().optional(),
  limit: z.number().int().min(1).max(500).optional().default(50),
});

export const FullFlowSchema = z.object({
  category: z.string().optional(),
  limit: z.number().int().min(1).max(500).optional().default(50),
  force: z.boolean().optional().default(false),
});

export const DecideSchema = z.object({
  decision: z.enum(["approved", "rejected"], {
    errorMap: () => ({ message: "Decision must be 'approved' or 'rejected'" }),
  }),
  note: z.string().optional(),
});

export const CompanyUpdateSchema = z.object({
  website: z.string().url().optional().nullable(),
  instagram: z.string().optional().nullable(),
  facebook: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
});

export const ScrapeTriggerSchema = z.object({
  source: z.enum(["google_places", "directories", "web"], {
    errorMap: () => ({ message: "Invalid source" }),
  }),
  category: z.string().optional(),
});

export const EnrichBatchSchema = z.object({
  limit: z.number().int().min(1).max(100).optional().default(10),
});

export const PaginationSchema = z.object({
  limit: z.string().optional().default("20"),
  offset: z.string().optional().default("0"),
});

export const DecisionFilterSchema = z.object({
  filter: z.enum(["all", "pending", "decided"]).optional().default("all"),
  limit: z.string().optional().default("100"),
});
