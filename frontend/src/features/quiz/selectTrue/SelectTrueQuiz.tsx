import { useState } from "react";
import "./SelectTrueQuiz.css";

interface Sentence {
  id: number;
  text: string;
  correct: boolean;
}

const sentences: Sentence[] = [
  { id: 1, text: "Koty są spoko.", correct: true },
  { id: 2, text: "Kamil jest mistrzem pisania testów :D", correct: false },
  { id: 3, text: "Life is brutal.", correct: true },
  { id: 4, text: "2 + 2 = 5.", correct: false },
  { id: 5, text: "Tomek jest dresiarzem", correct: false },
];

export default function SelectTrueQuiz() {
  const [selected, setSelected] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);

  const toggle = (id: number) => {
    if (checked) return; // 🔒 blokada po sprawdzeniu

    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const checkAnswers = () => {
    setChecked(true);
  };

  const reset = () => {
    setSelected([]);
    setChecked(false);
  };

  const isCorrect = (id: number) => {
    const sentence = sentences.find((s) => s.id === id);
    return sentence?.correct;
  };

  const isSelected = (id: number) => selected.includes(id);

  return (
    <div className="select-true-quiz">
      <h2>Zaznacz prawdziwe zdania</h2>

      {sentences.map((s) => {
        const correct = isCorrect(s.id);
        const selectedItem = isSelected(s.id);

        let className = "sentence";

        if (checked) {
          if (correct && selectedItem) className += " correct";
          else if (!correct && selectedItem) className += " wrong";
          else if (correct && !selectedItem) className += " missed";
        }

        return (
          <label key={s.id} className={className}>
            <input
              type="checkbox"
              checked={selectedItem}
              onChange={() => {
                toggle(s.id);
              }}
              disabled={checked} // 🔒 blokada
            />
            {s.text}
          </label>
        );
      })}

      <div className="buttons">
        {!checked ? (
          <button onClick={checkAnswers}>Sprawdź</button>
        ) : (
          <button onClick={reset}>Spróbuj jeszcze raz</button>
        )}
      </div>
    </div>
  );
}
