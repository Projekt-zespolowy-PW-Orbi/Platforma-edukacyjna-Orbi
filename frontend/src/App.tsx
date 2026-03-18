import { useState } from "react";
import DragAndDropQuiz from "features/quiz/dragAndDrop/DragAndDropQuiz";
interface SimplifyResponse {
  result: string;
}

export function App() {
  const [simplifyResult, setSimplifyResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSimplify() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/simplify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ x: "2 * a + 2 * a" }),
      });
      if (!res.ok) throw new Error(`HTTP ${String(res.status)}`);
      const data = (await res.json()) as SimplifyResponse;
      setSimplifyResult(data.result);
      console.log(data.result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1>Orbi</h1>
      <button onClick={handleSimplify} disabled={loading}>
        {loading ? "Loading..." : "Double 1"}
      </button>
      {simplifyResult !== null && <p data-testid="result">Result: {simplifyResult}</p>}
      {error && <p data-testid="error">Error: {error}</p>}
      <DragAndDropQuiz />
    </div>
  );
}
