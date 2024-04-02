import React, {useCallback, MouseEvent, memo, useMemo} from "react";
import {Box, Td} from "@chakra-ui/react";
import {Cell, flexRender} from "@tanstack/react-table";
import {Person} from "../makeData.ts";
import {useSpreadsheetGrid} from "../SpreadsheetGrid.tsx";
import {SpreadsheetSelectionRangeObject} from "../useSpreadsheetSelection";

type BodyCellWrapperInternalProps = {
  cell: Cell<Person, unknown>;
  flatRowIndex: number;
  columnIndex: number;
  dragRef: React.Ref<unknown> | null;
  isDragging: boolean;
};

export const BodyCellWrapper = ({
  cell,
  flatRowIndex,
  columnIndex,
  dragRef,
  isDragging,
}: BodyCellWrapperInternalProps) => {
  const {
    bodyCellSelected,
    bodyCellRangeData,
    bodyCellOnInteract,
    bodyCellOnMouseEnter,
  } = useSpreadsheetGrid();

  const spreadsheetCell = useMemo(() => {
    return { row: flatRowIndex, column: columnIndex };
  }, [flatRowIndex, columnIndex])

  const onInteract = useCallback(
    () => bodyCellOnInteract(spreadsheetCell),
    [bodyCellOnInteract, spreadsheetCell],
  );

  const onMouseEnter = useCallback(
    (event: MouseEvent<HTMLDivElement, MouseEvent>) =>
      bodyCellOnMouseEnter(spreadsheetCell, event),
    [bodyCellOnMouseEnter, spreadsheetCell],
  );

  if (cell.column.id === "control") {
    return (
      <Td
        key={cell.id}
        tabIndex={0}
        padding="6px"
        ref={dragRef}
        style={isDragging ? {cursor: 'grab', opacity: 0.5} : {}}
      >
        {flexRender(cell.column.columnDef.cell, cell.getContext())}
      </Td>
    );
  } else {
    return (
      <BodyCell
        key={cell.id}
        cell={cell}
        selected={bodyCellSelected(spreadsheetCell)}
        rangeData={bodyCellRangeData(spreadsheetCell)}
        onFocus={onInteract}
        onMouseEnter={onMouseEnter}
      />
    );
  }
};

type BodyCellInternalProps = {
  cell: Cell<Person, unknown>;
  selected: boolean;
  rangeData: string;
  onFocus: React.MouseEventHandler<HTMLDivElement>;
  onMouseEnter: React.MouseEventHandler<HTMLDivElement>;
};

export const BodyCellInternal = ({
  cell,
  selected,
  rangeData,
  onFocus,
  onMouseEnter,
}: BodyCellInternalProps) => {
  const rangeDataObject: SpreadsheetSelectionRangeObject =
    JSON.parse(rangeData);

  return (
    <Td
      tabIndex={0}
      padding="6px"
      background={selected ? 'cyan' : 'white'}
      border="1px solid"
      onMouseEnter={onMouseEnter}
      onFocus={onFocus}
      position="relative"
      userSelect="none"
    >
      {(rangeDataObject.enclosedBottom || rangeDataObject.enclosedTop || rangeDataObject.enclosedLeft || rangeDataObject.enclosedRight) && (
        <Box
          border="1px solid"
          background={'blue'}
          opacity={0.5}
          borderBottomColor={
            rangeDataObject.enclosedBottom ? 'blue' : 'transparent'
          }
          borderTopColor={
            rangeDataObject.enclosedTop ? 'blue' : 'transparent'
          }
          borderLeftColor={
            rangeDataObject.enclosedLeft ? 'blue' : 'transparent'
          }
          borderRightColor={
            rangeDataObject.enclosedRight ? 'blue' : 'transparent'
          }
          position="absolute"
          top={0}
          left={0}
          height={"100%"}
          width={"100%"}
        />
      )}
      {flexRender(cell.column.columnDef.cell, cell.getContext())}
    </Td>
  );
};

export const BodyCell = memo(BodyCellInternal)