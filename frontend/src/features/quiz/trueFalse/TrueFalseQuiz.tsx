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

  const handleAnswer = (id: number, value: boolean) => {
    setAnswers((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const checkAnswers = () => {
    const isCorrect = questions.every((q) => answers[q.id] === q.answer);

    setResult(isCorrect ? "correct" : "wrong");
  };

  const resetQuiz = () => {
    setAnswers({});
    setResult(null);
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

      {result === "correct" && (
        <p className="success">🎉 Wszystkie odpowiedzi poprawne!</p>
      )}

      {result === "wrong" && (
        <p className="error">❌ Niektóre odpowiedzi są błędne.</p>
      )}
    </div>
  );
}
