import { z } from "zod";

export const SimplifyRequestSchema = z.object({
  x: z.string(),
});

export const SimplifyResponseSchema = z.object({
  result: z.string(),
});

export type SimplifyRequest = z.infer<typeof SimplifyRequestSchema>;
export type SimplifyResponse = z.infer<typeof SimplifyResponseSchema>;
