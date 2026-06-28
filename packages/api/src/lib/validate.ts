import type { FastifyReply } from "fastify";
import type { ZodSchema } from "zod";

export function validateOrReply<T>(
  schema: ZodSchema<T>,
  data: unknown,
  reply: FastifyReply
): T | null {
  const result = schema.safeParse(data);
  if (!result.success) {
    reply.status(400).send({ error: result.error.issues[0].message });
    return null;
  }
  return result.data;
}
