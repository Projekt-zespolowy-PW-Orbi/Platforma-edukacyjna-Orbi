import { useDraggable } from "@dnd-kit/core";

const DraggableItem = ({ id, label }: { id: string; label: string }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id,
  });

  const style = {
    transform: transform
      ? `translate(${transform.x}px, ${transform.y}px)`
      : undefined,
    padding: "10px",
    border: "1px solid black",
    cursor: "grab",
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {label}
    </div>
  );
};

export default DraggableItem;
