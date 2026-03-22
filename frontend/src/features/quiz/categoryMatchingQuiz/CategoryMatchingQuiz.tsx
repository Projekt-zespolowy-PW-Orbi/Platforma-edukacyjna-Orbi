import "./categoryMatchingQuiz.css";
import { useState } from "react";
import { DndContext, useDraggable, useDroppable } from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";

interface CategoryItem {
  id: string;
  label: string;
  category: string;
}

const categories = ["zwierzęta", "rośliny", "planety"];

const items: CategoryItem[] = [
  { id: "1", label: "pies", category: "zwierzęta" },
  { id: "2", label: "kot", category: "zwierzęta" },
  { id: "3", label: "dąb", category: "rośliny" },
  { id: "4", label: "mars", category: "planety" },
];

function DraggableItem({ id, label }: { id: string; label: string }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id,
  });

  const style = {
    transform: transform
      ? `translate(${String(transform.x)}px, ${String(transform.y)}px)`
      : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      className="quiz-item"
    >
      {label}
    </div>
  );
}

function CategoryDropZone({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children?: React.ReactNode;
}) {
  const { setNodeRef } = useDroppable({
    id,
  });

  return (
    <div ref={setNodeRef} className="category">
      <h3>{label}</h3>
      {children}
    </div>
  );
}

export default function CategoryMatchingQuiz() {
  const [placements, setPlacements] = useState<Record<string, string | null>>(
    {},
  );

  const [result, setResult] = useState<"correct" | "wrong" | null>(null);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over) return;

    setPlacements((prev) => ({
      ...prev,
      [active.id as string]: over.id as string,
    }));
  }

  function checkAnswers() {
    const correct = items.every(
      (item) => placements[item.id] === item.category,
    );

    setResult(correct ? "correct" : "wrong");
  }

  function resetQuiz() {
    setPlacements({});
    setResult(null);
  }

  return (
    <div>
      <DndContext onDragEnd={handleDragEnd}>
        <div className="categories">
          {categories.map((cat) => (
            <CategoryDropZone key={cat} id={cat} label={cat}>
              {items
                .filter((i) => placements[i.id] === cat)
                .map((i) => (
                  <div key={i.id} className="quiz-item">
                    {i.label}
                  </div>
                ))}
            </CategoryDropZone>
          ))}
        </div>

        <div className="items">
          {items
            .filter((i) => !placements[i.id])
            .map((item) => (
              <DraggableItem key={item.id} id={item.id} label={item.label} />
            ))}
        </div>
      </DndContext>

      <div style={{ marginTop: "20px" }}>
        <button onClick={checkAnswers}>Sprawdź</button>
        <button onClick={resetQuiz}>Reset</button>
      </div>

      {result === "correct" && <p>Dobrze!</p>}
      {result === "wrong" && <p>Spróbuj jeszcze raz.</p>}
    </div>
  );
}
