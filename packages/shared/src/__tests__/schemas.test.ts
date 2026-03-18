import { describe, it, expect } from "vitest";
import { SimplifyRequestSchema, SimplifyResponseSchema } from "index.js";

describe("SimplifyRequestSchema", () => {
  it("accepts valid request", () => {
    const result = SimplifyRequestSchema.parse({ x: "5 + 5" });
    expect(result).toEqual({ x: "5 + 5" });
  });

  it("rejects integer", () => {
    expect(() => SimplifyRequestSchema.parse({ x: 1 })).toThrow();
  });

  it("rejects double", () => {
    expect(() => SimplifyRequestSchema.parse({ x: 1.5 })).toThrow();
  });

  it("rejects missing x", () => {
    expect(() => SimplifyRequestSchema.parse({})).toThrow();
  });
});

describe("SimplifyResponseSchema", () => {
  it("accepts valid response", () => {
    const result = SimplifyResponseSchema.parse({ result: "10 + 10" });
    expect(result).toEqual({ result: "10 + 10" });
  });

  it("rejects int", () => {
    expect(() => SimplifyResponseSchema.parse({ result: 1 })).toThrow();
  });

  it("rejects double", () => {
    expect(() => SimplifyResponseSchema.parse({ result: 1.5 })).toThrow();
  });
});
