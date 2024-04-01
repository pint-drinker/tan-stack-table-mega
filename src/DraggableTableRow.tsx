import React from "react";
import {useDrag, useDrop} from "react-dnd";
import {Tr} from "@chakra-ui/react";

export function DraggableTableRow({row, index, moveRow, ...props}) {
  const ref = React.useRef(null);
  const [, drop] = useDrop({
    accept: "row",
    drop(item) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const dropIndex = index;

      if (dragIndex === dropIndex) {
        return;
      }
      if (item.row.id === row.id) {
        return;
      }

      moveRow(item.row.id, row.id);
      item.index = dropIndex;
    },
  });

  const [{isDragging}, drag] = useDrag({
    type: "row",
    item: () => {
      return {index, row};
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));

  return (
    <Tr
      ref={ref}
      {...props}
      style={{
        ...props.style,
        opacity: isDragging ? 0 : 1,
      }}
    >
      {props.children}
    </Tr>
  );
}