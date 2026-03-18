import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { EventEmitter } from "node:events";

class MockProcess extends EventEmitter {
  killed = false;
  stdout = new EventEmitter();
  stderr = new EventEmitter();
  stdin = {
    write: vi.fn((_data: string, cb?: (err?: Error) => void) => {
      if (cb) cb();
    }),
    end: vi.fn(),
  };
  kill() {
    this.killed = true;
  }
}

/**
 * Helper: creates a spawn mock that returns a fresh MockProcess per call,
 * and invokes `behavior` on each spawned process (with access to the process).
 */
function setupSpawn(
  spawnFn: ReturnType<typeof vi.fn>,
  behavior: (proc: MockProcess, callIndex: number) => void
) {
  let callIndex = 0;
  spawnFn.mockImplementation(() => {
    const proc = new MockProcess();
    const idx = callIndex++;
    setImmediate(() => behavior(proc, idx));
    return proc;
  });
}

/** Reads the request JSON that was written to a mock process's stdin. */
function getRequest(proc: MockProcess): { id: string; op: string; x: string } {
  const written = proc.stdin.write.mock.calls[0]![0] as string;
  return JSON.parse(written) as { id: string; op: string; x: string };
}

/** Simulates a successful engine response. */
function respondOk(proc: MockProcess, result: string) {
  const req = getRequest(proc);
  proc.stdout.emit("data", Buffer.from(
    JSON.stringify({ id: req.id, ok: true, result }) + "\n"
  ));
  proc.emit("close", 0);
}

/** Simulates an engine error response (ok=false). */
function respondError(proc: MockProcess, error: string) {
  const req = getRequest(proc);
  proc.stdout.emit("data", Buffer.from(
    JSON.stringify({ id: req.id, ok: false, error }) + "\n"
  ));
  proc.emit("close", 0);
}

vi.mock("node:child_process", () => ({
  spawn: vi.fn(() => new MockProcess()),
}));

const { EngineAdapter } = await import("infrastructure/engine.adapter.js");
const { spawn } = await import("node:child_process");
const spawnMock = spawn as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  spawnMock.mockClear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("EngineAdapter", () => {
  describe("call - success path", () => {
    it("returns result when engine responds with ok=true", async () => {
      setupSpawn(spawnMock, (proc) => respondOk(proc, "42"));

      const adapter = new EngineAdapter();
      const result = await adapter.call("double", "21");

      expect(result).toEqual({ result: "42" });
    });

    it("sends correct op and x in the JSON request", async () => {
      setupSpawn(spawnMock, (proc) => {
        const req = getRequest(proc);
        expect(req.op).toBe("gcd");
        expect(req.x).toBe("12");
        respondOk(proc, "4");
      });

      const adapter = new EngineAdapter();
      await adapter.call("gcd","12");
    });

    it("ignores non-JSON lines and finds the response by matching ID", async () => {
      setupSpawn(spawnMock, (proc) => {
        const req = getRequest(proc);
        proc.stdout.emit("data", Buffer.from(
          "debug garbage\n" +
          JSON.stringify({ id: "wrong-id", ok: true, result: 999 }) + "\n" +
          JSON.stringify({ id: req.id, ok: true, result: 10 }) + "\n"
        ));
        proc.emit("close", 0);
      });

      const adapter = new EngineAdapter();
      const result = await adapter.call("add", "5");

      expect(result).toEqual({ result: "10" });
    });
  });

  describe("call - error paths", () => {
    it("throws when engine responds with ok=false (after all retries)", async () => {
      setupSpawn(spawnMock, (proc) => respondError(proc, "unknown op"));

      const adapter = new EngineAdapter();

      await expect(adapter.call("bad_op", "0")).rejects.toThrow("unknown op");
      // Should have retried MAX_RETRIES (3) times
      expect(spawnMock).toHaveBeenCalledTimes(3);
    });

    it("throws when engine exits with non-zero code (after all retries)", async () => {
      setupSpawn(spawnMock, (proc) => {
        proc.stderr.emit("data", Buffer.from("segfault"));
        proc.emit("close", 1);
      });

      const adapter = new EngineAdapter();

      await expect(adapter.call("crash", "0")).rejects.toThrow(/exited with code 1/);
    });

    it("throws when no matching ID found in stdout", async () => {
      setupSpawn(spawnMock, (proc) => {
        proc.stdout.emit("data", Buffer.from(
          JSON.stringify({ id: "totally-different", ok: true, result: 0 }) + "\n"
        ));
        proc.emit("close", 0);
      });

      const adapter = new EngineAdapter();

      await expect(adapter.call("op", "1")).rejects.toThrow("No response with matching id");
    });

    it("throws when engine process emits error event", async () => {
      setupSpawn(spawnMock, (proc) => {
        proc.emit("error", new Error("ENOENT"));
      });

      const adapter = new EngineAdapter();

      await expect(adapter.call("op", "1")).rejects.toThrow("ENOENT");
    });

    it("throws when stdin.write fails", async () => {
      spawnMock.mockImplementation(() => {
        const proc = new MockProcess();
        proc.stdin.write = vi.fn((_data: string, cb?: (err?: Error) => void) => {
          if (cb) cb(new Error("broken pipe"));
        });
        return proc;
      });

      const adapter = new EngineAdapter();

      await expect(adapter.call("op", "1")).rejects.toThrow("broken pipe");
    });

    it("includes stderr content in error message on non-zero exit", async () => {
      setupSpawn(spawnMock, (proc) => {
        proc.stderr.emit("data", Buffer.from("out of memory"));
        proc.emit("close", 137);
      });

      const adapter = new EngineAdapter();

      await expect(adapter.call("op", '1')).rejects.toThrow(/out of memory/);
    });
  });

  describe("call - retry behavior", () => {
    it("retries on failure and succeeds on a later attempt", async () => {
      setupSpawn(spawnMock, (proc, idx) => {
        if (idx < 2) {
          proc.emit("error", new Error("ENOENT"));
        } else {
          respondOk(proc, "100");
        }
      });

      const adapter = new EngineAdapter();
      const result = await adapter.call("op", "50");

      expect(result).toEqual({ result: 100 });
      expect(spawnMock).toHaveBeenCalledTimes(3);
    });

    it("uses a unique request ID for each retry attempt", async () => {
      const ids: string[] = [];

      setupSpawn(spawnMock, (proc, idx) => {
        const req = getRequest(proc);
        ids.push(req.id);

        if (idx < 2) {
          proc.emit("error", new Error("fail"));
        } else {
          respondOk(proc, "1");
        }
      });

      const adapter = new EngineAdapter();
      await adapter.call("op", "1");

      expect(ids).toHaveLength(3);
      // All IDs should be unique (nanoid)
      expect(new Set(ids).size).toBe(3);
    });

    it("throws the last error after all retries exhausted", async () => {
      let callCount = 0;
      setupSpawn(spawnMock, (proc) => {
        callCount++;
        proc.emit("error", new Error(`fail-${String(callCount)}`));
      });

      const adapter = new EngineAdapter();

      await expect(adapter.call("op", "1")).rejects.toThrow("fail-3");
      expect(callCount).toBe(3);
    });
  });

  describe("shutdown", () => {
    it("is a no-op and does not throw", () => {
      const adapter = new EngineAdapter();
      expect(() => adapter.shutdown()).not.toThrow();
    });
  });
});
