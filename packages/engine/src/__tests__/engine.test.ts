import { describe, it, expect } from "vitest";
import { spawn } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const isWindows = process.platform === "win32";
const binaryName = isWindows ? "orbi-engine.exe" : "orbi-engine";
const enginePath = resolve(__dirname, "../../build", binaryName);

function sendRequest(
  input: object,
): Promise<{ id: string; ok: boolean; result?: string; error?: string }> {
  return new Promise((resolve, reject) => {
    const proc = spawn(enginePath);
    let stdout = "";

    proc.stdout.on("data", (data: Buffer) => {
      stdout += data.toString();
    });

    proc.stderr.on("data", (data: Buffer) => {
      reject(new Error(`stderr: ${data.toString()}`));
    });

    proc.on("close", () => {
      try {
        resolve(JSON.parse(stdout.trim()));
      } catch (e) {
        reject(new Error(`Failed to parse: ${stdout}`));
      }
    });

    proc.stdin.write(JSON.stringify(input) + "\n");
    proc.stdin.end();
  });
}

describe("orbi-engine", () => {
  it("simple sum result", async () => {
    const res = await sendRequest({ id: "t1", op: "simplify", x: "5 + 5 + 5 + 5" });
    expect(res).toEqual({ id: "t1", ok: true, result: "20" });
  });

  it("simple product result", async () => {
    const res = await sendRequest({ id: "t2", op: "simplify", x: "1 * 2 * 3 * 4" });
    expect(res).toEqual({ id: "t2", ok: true, result: "24" });
  });

});
