import { useState } from "react";
import DragAndDropQuiz from "features/quiz/dragAndDrop/DragAndDropQuiz";
import CategoryMatchingQuiz from "features/quiz/categoryMatchingQuiz/CategoryMatchingQuiz";
import MatchingLinesQuiz from "features/quiz/matchingLines/MatchingLinesQuiz";
import TrueFalseQuiz from "features/quiz/trueFalse/TrueFalseQuiz";
interface DoubleResponse {
  result: number;
}

export function App() {
  const [result, setResult] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDouble() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/double", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ x: 1 }),
      });
      if (!res.ok) throw new Error(`HTTP ${String(res.status)}`);
      const data = (await res.json()) as DoubleResponse;
      setResult(data.result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1>Orbi</h1>
      <button onClick={handleDouble} disabled={loading}>
        {loading ? "Loading..." : "Double 1"}
      </button>
      {result !== null && <p data-testid="result">Result: {result}</p>}
      {error && <p data-testid="error">Error: {error}</p>}
      <DragAndDropQuiz />
      <CategoryMatchingQuiz />
      <MatchingLinesQuiz />
      <TrueFalseQuiz />
    </div>
  );
}
