import { useState } from "react";
import Xarrow from "react-xarrows";
import "./MatchingLinesQuiz.css";

const leftItems = ["kot", "pies", "ryba"];
const rightItems = ["cat", "dog", "fish"];
const correctPairs: Record<string, string> = {
  kot: "cat",
  pies: "dog",
  ryba: "fish",
};

interface Connection {
  left: string;
  right: string;
}

export default function MatchingLinesQuiz() {
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(false);

  const handleLeftClick = (item: string) => {
    if (showCorrectAnswers) return;
    if (connections.some((c) => c.left === item)) return;
    setSelectedLeft(item);
  };

  const handleRightClick = (item: string) => {
    if (showCorrectAnswers) return;
    if (!selectedLeft) return;

    if (connections.some((c) => c.right === item)) return;

    setConnections((prev) => [...prev, { left: selectedLeft, right: item }]);

    setSelectedLeft(null);
  };

  const checkAnswers = () => {
    const isCorrect =
      connections.length === leftItems.length &&
      connections.every((c) => correctPairs[c.left] === c.right);

    setResult(isCorrect ? "correct" : "wrong");
    setShowResult(true);
  };

  const handleShowAnswers = () => {
    const correctConnections = leftItems.map((left) => ({
      left,
      right: correctPairs[left],
    }));

    setConnections(correctConnections);
    setShowCorrectAnswers(true);
  };

  const resetQuiz = () => {
    setConnections([]);
    setSelectedLeft(null);
    setResult(null);
    setShowResult(false);
    setShowCorrectAnswers(false);
  };

  return (
    <div className="quiz-container">
      <div className="columns">
        {/* LEFT COLUMN */}
        <div className="column">
          {leftItems.map((item) => (
            <div
              role="button"
              tabIndex={0}
              key={item}
              id={`left-${item}`}
              className={`quiz-item ${selectedLeft === item ? "selected" : ""} ${
                connections.some((c) => c.left === item) ? "used" : ""
              }`}
              onClick={() => {
                handleLeftClick(item);
              }}
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === "Enter" || e.key === " ") {
                  handleLeftClick(item);
                }
              }}
            >
              {item}
            </div>
          ))}
        </div>

        {/* RIGHT COLUMN */}
        <div className="column">
          {rightItems.map((item) => (
            <div
              role="button"
              tabIndex={0}
              key={item}
              id={`right-${item}`}
              className={`quiz-item ${
                connections.some((c) => c.right === item) ? "used" : ""
              }`}
              onClick={() => {
                handleRightClick(item);
              }}
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === "Enter" || e.key === " ") {
                  handleRightClick(item);
                }
              }}
            >
              {item}
            </div>
          ))}
        </div>

        {/* ARROWS */}
        {connections.map((c, i) => (
          <Xarrow
            key={i}
            start={`left-${c.left}`}
            end={`right-${c.right}`}
            strokeWidth={3}
            color="#3b82f6"
            curveness={0.4}
          />
        ))}
      </div>
      <div className="buttons">
        <button onClick={resetQuiz}>Reset</button>
        <button
          onClick={checkAnswers}
          disabled={connections.length !== leftItems.length}
        >
          Sprawdź
        </button>
      </div>

      {showResult && (
        <div className="quiz-result-overlay">
          <div className="quiz-result-box">
            <h2>{result === "correct" ? "Dobrze!" : "Spróbuj jeszcze raz"}</h2>

            <div className="buttons">
              <button onClick={resetQuiz}>Reset</button>
              <button onClick={handleShowAnswers}>
                Pokaż poprawne odpowiedzi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
