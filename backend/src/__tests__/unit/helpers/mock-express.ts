import { vi } from "vitest";
import type { Request, Response } from "express";

/**
 * Creates a mock Express Request object.
 */
export function mockRequest(overrides: {
  params?: Record<string, string>;
  query?: Record<string, string>;
  body?: unknown;
} = {}): Request {
  return {
    params: overrides.params ?? {},
    query: overrides.query ?? {},
    body: overrides.body ?? {},
  } as unknown as Request;
}

/**
 * Creates a mock Express Response object with spied methods.
 * Chains correctly: res.status(x).json(y) / res.status(x).send()
 */
export function mockResponse(): Response & {
  _status: number | undefined;
  _json: unknown;
  _sent: boolean;
} {
  const res = {
    _status: undefined as number | undefined,
    _json: undefined as unknown,
    _sent: false,
    status: vi.fn(),
    json: vi.fn(),
    send: vi.fn(),
  };

  res.status.mockImplementation((code: number) => {
    res._status = code;
    return res;
  });
  res.json.mockImplementation((data: unknown) => {
    res._json = data;
    return res;
  });
  res.send.mockImplementation(() => {
    res._sent = true;
    return res;
  });

  return res as unknown as Response & {
    _status: number | undefined;
    _json: unknown;
    _sent: boolean;
  };
}
