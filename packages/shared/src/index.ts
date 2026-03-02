import { z } from "zod";

export const DoubleRequestSchema = z.object({
  x: z.number().int(),
});

export const DoubleResponseSchema = z.object({
  result: z.number().int(),
});

export type DoubleRequest = z.infer<typeof DoubleRequestSchema>;
export type DoubleResponse = z.infer<typeof DoubleResponseSchema>;
