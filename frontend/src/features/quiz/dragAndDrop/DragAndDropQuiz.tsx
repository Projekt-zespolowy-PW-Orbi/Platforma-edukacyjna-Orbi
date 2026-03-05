import { DndContext } from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { useState } from "react";
import DraggableItem from "./DraggableItem";
import DropZone from "./DropZone";

const colors = [
  { id: "red", label: "Czerwony", color: "red" },
  { id: "blue", label: "Niebieski", color: "blue" },
  { id: "green", label: "Zielony", color: "green" },
  { id: "yellow", label: "Żółty", color: "yellow" },
  { id: "purple", label: "Fioletowy", color: "purple" },
];

const shuffleArray = (array: typeof colors) => {
  return [...array].sort(() => Math.random() - 0.5);
};

const shuffled = shuffleArray(colors);

const DragAndDropQuiz = () => {
  const [matches, setMatches] = useState<Record<string, string | null>>({});

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over) {
      setMatches((prev) => ({
        ...prev,
        [over.id as string]: active.id as string,
      }));
    }
  };

  const checkAnswers = () => {
    const allCorrect = colors.every((item) => matches[item.id] === item.id);

    if (allCorrect) {
      alert("Wszystkie odpowiedzi poprawne! 🎉");
    } else {
      alert("Spróbuj jeszcze raz 🙂");
    }
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div>
        <h2>Dopasuj obrazek do pojęcia</h2>

        {/* GÓRNY RZĄD */}
        <div style={{ display: "flex", gap: "10px" }}>
          {colors.map((item) => (
            <div key={item.id}>
              <div
                style={{
                  width: "100px",
                  height: "100px",
                  border: "3px solid black",
                  backgroundColor: item.color,
                }}
              />
              <DropZone key={item.id} id={item.id} match={matches[item.id]} />
            </div>
          ))}
        </div>

        {/* DOLNY RZĄD */}
        <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
          {shuffled.map((item) => (
            <DraggableItem key={item.id} id={item.id} label={item.label} />
          ))}
        </div>
      </div>
      <button onClick={checkAnswers}>Sprawdź</button>
    </DndContext>
  );
};

export default DragAndDropQuiz;
