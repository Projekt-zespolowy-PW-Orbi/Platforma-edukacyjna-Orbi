type QuizResultProps = {
  result: "correct" | "wrong";
  onClose: () => void;
};

const QuizResult = ({ result, onClose }: QuizResultProps) => {
  return (
    <div className="quiz-result-overlay">
      <div className="quiz-result-box">
        {result === "correct" ? (
          <h2> Dobrze!</h2>
        ) : (
          <h2> Spróbuj jeszcze raz</h2>
        )}

        <button onClick={onClose}>Zamknij</button>
      </div>
    </div>
  );
};

export default QuizResult;
