import { describe, it, expect, afterAll } from "vitest";
import request from "supertest";
import { buildApp } from "server.js";

const { app, shutdown } = buildApp();

afterAll(() => {
  shutdown();
});

describe("POST /double", () => {
  it("returns doubled value", async () => {
    const res = await request(app)
      .post("/double")
      .send({ x: 1 });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ result: 2 });
  });

  it("returns doubled value for larger number", async () => {
    const res = await request(app)
      .post("/double")
      .send({ x: 21 });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ result: 42 });
  });

  it("rejects non-integer", async () => {
    const res = await request(app)
      .post("/double")
      .send({ x: 1.5 });

    expect(res.status).toBe(400);
  });

  it("rejects missing body", async () => {
    const res = await request(app)
      .post("/double")
      .send({});

    expect(res.status).toBe(400);
  });
});
