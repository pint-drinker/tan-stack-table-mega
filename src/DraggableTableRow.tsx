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
  const [isRowDragging, setIsRowDragging] = React.useState(false);
  const dropRef = React.useRef(null);
  const [, drop] = useDrop({
    accept: "row",
    drop(item) {
      if (!dropRef.current) {
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

  drop(dropRef)

  // Only apply the drag source to the specific cell acting as the drag handle
  const dragHandleProps = (columnId: string) => {
    if (columnId === "control") {
      const [{ isDragging }, drag] = useDrag({
        type: "row",
        item: () => {
          return { index, row };
        },
        collect: (monitor) => ({
          isDragging: monitor.isDragging(),
        }),
      });

      React.useEffect(() => {
        setIsRowDragging(isDragging);
      }, [isDragging])

      // Attach the drag ref to the cell
      return {
        ref: drag,
        style: {
          cursor: "grab",
          opacity: isDragging ? 0.5 : 1,
        },
      };
    }

    return {};
  };

  return (
    <Tr
      ref={dropRef}
      {...{
        opacity: isRowDragging ? 0.5 : 1,
      }}
      {...props}
    >
      {
        row.getVisibleCells().map((cell) => {
          const dragProps = dragHandleProps(cell.column.id);
          return (
            <Td
              key={cell.id}
              padding="6px"
              ref={dragProps.ref ?? null}
              style={{...dragProps.style}}
            >
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </Td>
          );
        })
      }
    </Tr>
  );
}