import { useDroppable } from "@dnd-kit/core";

const DropZone = ({
  id,
  match,
  onRemove,
}: {
  id: string;
  match?: string | null;
  onRemove: (id: string) => void;
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <button
      onClick={() => {
        if (match) {
          onRemove(id);
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          onRemove(id);
        }
      }}
      ref={setNodeRef}
      style={{
        width: "100px",
        height: "40px",
        border: isOver ? "3px solid black" : "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {match}
    </button>
  );
};

export default DropZone;
