import React from "react";
import {useDrag, useDrop} from "react-dnd";
import {Td, Tr} from "@chakra-ui/react";
import {flexRender, Row} from "@tanstack/react-table";

type DraggableTableRowProps = {
  row: Row<any>;
  index: number;
  moveRow: (dragId: string, dropId: string) => void;
}

export function DraggableTableRow({row, index, moveRow, ...props}: DraggableTableRowProps) {
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

  // TODO: make the ref only hit the drag handle child so we can do cell selection otherwise...but
  //  we still want to visualize dragging the whole row
  return (
    <Tr
      // ref={ref}
      {...props}
      style={{
        ...props.style,
        opacity: isDragging ? 0 : 1,
      }}
    >
      {row.getVisibleCells().map((cell) => (
        <Td
          key={cell.id}
          style={{padding: "6px"}}
          ref={cell.column.id === "control" ? ref : null}
        >
          {flexRender(
            cell.column.columnDef.cell,
            cell.getContext(),
          )}
        </Td>
      ))}
    </Tr>
  );
}