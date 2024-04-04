import React, {useCallback, MouseEvent, memo, useMemo, useEffect, useRef} from "react";
import {Box, Td, Text} from "@chakra-ui/react";
import {Cell, flexRender} from "@tanstack/react-table";
import {Person} from "../makeData.ts";
import {useSpreadsheetGrid} from "../SpreadsheetGrid.tsx";
import {SpreadsheetSelectionRangeObject} from "../useSpreadsheetSelection";
import {useTableContext} from "../tableContext.tsx";
import {InputPosition} from "./EditableCell.tsx";

type FileCellProps = {
  cell: Cell<Person, unknown>;
}

const FileCell = ({cell}: FileCellProps) => {
  // TODO: implement a drag and drop
  return (
    <Td
      key={cell.id}
      tabIndex={0}
      padding="6px"
      border="1px solid"
    >
      <Text>{String(cell.getValue())}</Text>
    </Td>
  );
};

type ControlCellProps = {
  cell: Cell<Person, unknown>;
  dragRef: React.Ref<unknown> | null;
  isDragging: boolean;
};

const ControlCell = ({cell, dragRef, isDragging}: ControlCellProps) => {
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
};

type BodyCellWrapperInternalProps = ControlCellProps & {
  flatRowIndex: number;
  columnIndex: number;
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
  const {enableEdit} = useTableContext();

  const spreadsheetCell = useMemo(() => {
    return {row: flatRowIndex, column: columnIndex};
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

  switch (cell.column.id) {
    case "control":
      return (
        <ControlCell cell={cell} dragRef={dragRef} isDragging={isDragging}/>
      );
    case "file":
      return (
        <FileCell cell={cell}/>
      )
    default:
      return (
        <BodyCell
          key={cell.id}
          cell={cell}
          selected={bodyCellSelected(spreadsheetCell)}
          rangeData={bodyCellRangeData(spreadsheetCell)}
          onFocus={onInteract}
          onMouseEnter={onMouseEnter}
          enableEdit={enableEdit}
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
  enableEdit: (cell: Cell<Person, unknown>, cellRect: InputPosition) => void;
};

export const BodyCellInternal = ({
                                   cell,
                                   selected,
                                   rangeData,
                                   onFocus,
                                   onMouseEnter,
                                   enableEdit,
                                 }: BodyCellInternalProps) => {
  const ref = useRef<HTMLDivElement>();

  const rangeDataObject: SpreadsheetSelectionRangeObject =
    JSON.parse(rangeData);

  // TODO remove this? check if its currently focused instead of refocusing?
  useEffect(() => {
    if (selected === true) {
      ref.current?.focus();
    }
  }, [selected]);

  const onEditTrigger = useCallback(() => {
    if (ref.current) {
      const rect = ref.current?.getBoundingClientRect();
      enableEdit(cell, rect);
    }
  }, [selected, ref.current])

  // TODO: clean up border styling
  // TODO: clean up cell interactions - enter to begin editing, etc.
  return (
    <Td
      ref={ref}
      tabIndex={0}
      padding="6px"
      background={selected ? 'cyan' : 'white'}
      border="1px solid"
      onMouseEnter={onMouseEnter}
      onFocus={onFocus}
      onDoubleClick={onEditTrigger}
      position="relative"
      userSelect="none"
    >
      {rangeDataObject.inRange && (
        <Box
          background={rangeDataObject.inRange ? 'blue' : "none"}
          opacity={0.5}
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