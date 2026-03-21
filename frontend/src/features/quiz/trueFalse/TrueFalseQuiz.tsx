import { useState } from "react";
import "./TrueFalseQuiz.css";

interface Question {
  id: number;
  text: string;
  answer: boolean;
}

const questions: Question[] = [
  { id: 1, text: "React jest biblioteką JavaScript.", answer: true },
  { id: 2, text: "TypeScript jest językiem backendowym.", answer: false },
  { id: 3, text: "HTML służy do stylowania strony.", answer: false },
];

export default function TrueFalseQuiz() {
  const [answers, setAnswers] = useState<Record<number, boolean | null>>({});
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(false);

  const handleAnswer = (id: number, value: boolean) => {
    if (showCorrectAnswers) return;
    setAnswers((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const checkAnswers = () => {
    const isCorrect = questions.every((q) => answers[q.id] === q.answer);

    setResult(isCorrect ? "correct" : "wrong");
    setShowResult(true);
  };

  const resetQuiz = () => {
    setAnswers({});
    setResult(null);
    setShowResult(false);
    setShowCorrectAnswers(false);
  };

  const handleShowAnswers = () => {
    const correctAnswers: Record<number, boolean> = {};

    questions.forEach((q) => {
      correctAnswers[q.id] = q.answer;
    });

    setAnswers(correctAnswers);
    setShowCorrectAnswers(true);
  };

  return (
    <div className="tf-container">
      <h2>Prawda czy fałsz?</h2>

      <table>
        <thead>
          <tr>
            <th>Zdanie</th>
            <th>Prawda</th>
            <th>Fałsz</th>
          </tr>
        </thead>

        <tbody>
          {questions.map((q) => (
            <tr key={q.id}>
              <td>{q.text}</td>

              <td>
                <input
                  type="checkbox"
                  checked={answers[q.id] === true}
                  onChange={() => {
                    handleAnswer(q.id, true);
                  }}
                />
              </td>

              <td>
                <input
                  type="checkbox"
                  checked={answers[q.id] === false}
                  onChange={() => {
                    handleAnswer(q.id, false);
                  }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="buttons">
        <button onClick={checkAnswers}>Sprawdź</button>
        <button onClick={resetQuiz}>Reset</button>
      </div>

      {showResult && (
        <div className="quiz-result-overlay">
          <div className="quiz-result-box">
            <h2>
              {result === "correct" ? "✅ Dobrze!" : "❌ Spróbuj jeszcze raz"}
            </h2>

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
