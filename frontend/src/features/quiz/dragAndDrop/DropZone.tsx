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
    <div
      onClick={() => match && onRemove(id)}
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
    </div>
  );
};

export default DropZone;
