import React, {useEffect} from "react";
import {useDrag, useDrop} from "react-dnd";
import {Tr} from "@chakra-ui/react";
import {BodyCellWrapper} from "./components/BodyCell.tsx";
import {useTableContext} from "./tableContext.tsx";

type DraggableTableRowProps = {
  index: number;
}

export function DraggableTableRow({index, ...props}: DraggableTableRowProps) {
  const { rows, rowIdToFlatRowIndex, moveRow } = useTableContext();
  const row = rows[index];
  const flatRowIndex = rowIdToFlatRowIndex[row.id];
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

  const [{ isDragging }, dragRef] = useDrag({
    type: "row",
    item: () => {
      return { index, row };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  useEffect(() => {
    setIsRowDragging(isDragging);
  }, [isDragging])

  return (
    <Tr
      ref={dropRef}
      opacity={isRowDragging ? 0.5 : 1}
      {...props}
    >
      {
        row.getVisibleCells().map((cell, index) => {
          return (
            <BodyCellWrapper
              key={cell.id}
              cell={cell}
              flatRowIndex={flatRowIndex}
              columnIndex={index}
              dragRef={dragRef}
              isDragging={isDragging}
            />
          )
        })
      }
    </Tr>
  );
};
