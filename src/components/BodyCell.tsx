import React, {useCallback, MouseEvent, memo, useMemo, useEffect, useRef, MouseEventHandler} from "react";
import {Box, Td} from "@chakra-ui/react";
import {Cell, flexRender} from "@tanstack/react-table";
import {Person} from "../makeData.ts";
import {useSpreadsheetGrid} from "../SpreadsheetGrid.tsx";
import {SpreadsheetSelectionRangeObject} from "../useSpreadsheetSelection";
import {useTableContext} from "../tableContext.tsx";
import {InputPosition} from "./EditableCell.tsx";

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
  const { enableEdit } = useTableContext();

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

  // TODO remove this? check if its currently focused?
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