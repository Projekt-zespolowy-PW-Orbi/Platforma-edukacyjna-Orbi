import { useDroppable } from "@dnd-kit/core";

const DropZone = ({ id, match }: { id: string; match?: string | null }) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <div
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
