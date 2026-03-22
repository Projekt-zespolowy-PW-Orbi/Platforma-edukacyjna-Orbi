interface Props {
  isCorrect: boolean;
  onReset: () => void;
  onShowAnswers: () => void;
}

export default function QuizResultOverlay({
  isCorrect,
  onReset,
  onShowAnswers,
}: Props) {
  return (
    <div className="quiz-result-overlay">
      <div className="quiz-result-box">
        <h2>{isCorrect ? "✅ Dobrze!" : "❌ Spróbuj jeszcze raz"}</h2>

        <div className="buttons">
          <button onClick={onReset}>Reset</button>
          <button onClick={onShowAnswers}>Pokaż poprawne odpowiedzi</button>
        </div>
      </div>
    </div>
  );
}
