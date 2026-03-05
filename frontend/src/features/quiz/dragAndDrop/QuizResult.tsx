interface QuizResultProps {
  result: "correct" | "wrong";
  onClose: () => void;
}

const QuizResult = ({ result, onClose }: QuizResultProps) => {
  return (
    <div className="quiz-result-overlay">
      <div className="quiz-result-box">
        <h2>{result === "correct" ? "Brawo!" : "Spróbuj jeszcze raz"}</h2>

        <button
          onClick={() => {
            onClose();
          }}
        >
          {result === "wrong" ? "Spróbuj jeszcze raz" : "Zamknij"}
        </button>
      </div>
    </div>
  );
};

export default QuizResult;
