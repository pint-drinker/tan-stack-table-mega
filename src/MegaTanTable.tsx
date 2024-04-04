import {useCallback, useMemo, useState} from "react";
import {TableVirtuoso} from "react-virtuoso";
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Table,
  Text,
  Th,
  Tr,
} from '@chakra-ui/react';
import {DragHandleIcon} from '@chakra-ui/icons'

import {
  ColumnDef,
  ExpandedState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {makeData, Person} from "./makeData";
import {moveEntityCorrectly, navigateTree} from "./utils.ts";
import {Filter} from "./Filter.tsx";
import {IndeterminateCheckbox} from "./IndeterminateCheckbox.tsx";
import {DraggableTableRow} from "./DraggableTableRow.tsx";
import {SpreadsheetSelectionCell, useSpreadsheetSelection} from "./useSpreadsheetSelection";
import {SpreadsheetGridProvider} from "./SpreadsheetGrid.tsx";
import {TableContextProvider} from "./tableContext.tsx";
import {EditableCell, useEditableCell} from "./components/EditableCell.tsx";

const TableComponent = ({style, ...props}) => {
  return (
    <Table
      {...props}
      style={{
        ...style,
        width: "unset",
        tableLayout: "fixed",
        borderCollapse: "collapse",
        borderSpacing: 0,
      }}
    />
  );
};

const TableRowComponent = (props) => {
  const index = props["data-index"];
  return (
    <DraggableTableRow
      index={index}
      {...props}
    />
  );
};

export function MegaTanTable() {
  const [dataSize, setDataSize] = useState<number>(1000);
  const [childDepth1, setChildDepth1] = useState<number>(5);
  const [childDepth2, setChildDepth2] = useState<number>(3);
  const [data, setData] = useState(() => makeData(dataSize, childDepth1, childDepth2));
  const refreshData = () => setData(() => makeData(dataSize, childDepth1, childDepth2));
  const [expanded, setExpanded] = useState<ExpandedState>({});

  const defaultColumn = useMemo(() => {
    return {
      cell: ({getValue}) => {
        return <Text>{String(getValue())}</Text>
      },
    };
  }, []);

  const updateData = useCallback((rowId: string, columnId: string, value: any) => {
    setData((old) => {
      // TODO: speed this up?
      const integerIndices = rowId.split(".");
      const out = [...old];
      const oldRow = navigateTree(out, integerIndices);
      const newRow = {
        ...oldRow,
        [columnId]: value,
      };
      Object.assign(oldRow, newRow);
      return out;
    });
  }, []);

  const columns = useMemo<ColumnDef<Person>[]>(
    () => [
      {
        id: 'control',
        size: 130,
        header: ({table, header}) => (
          <Box width={`${header.column.getSize()}px`}>
            <IndeterminateCheckbox
              {...{
                checked: table.getIsAllRowsSelected(),
                indeterminate: table.getIsSomeRowsSelected(),
                onChange: table.getToggleAllRowsSelectedHandler(),
              }}
            />{" "}
            <button
              {...{
                onClick: table.getToggleAllRowsExpandedHandler(),
              }}
            >
              {table.getIsAllRowsExpanded() ? "👇" : "👉"}
            </button>
          </Box>
        ),
        cell: ({row, cell}) => (
          <Flex>
            <Text fontSize="xs">{row.id}</Text>
            <Box paddingLeft={`${row.depth * 2}rem`} width={`${cell.column.getSize()}px`}>
              <DragHandleIcon/>
              <IndeterminateCheckbox
                {...{
                  checked: row.getIsSelected(),
                  indeterminate: row.getIsSomeSelected(),
                  onChange: row.getToggleSelectedHandler(),
                }}
              />{" "}
              {row.getCanExpand() ? (
                <button
                  {...{
                    onClick: row.getToggleExpandedHandler(),
                    style: {cursor: "pointer"},
                  }}
                >
                  {row.getIsExpanded() ? "👇" : "👉"}
                </button>
              ) : null}
            </Box>
          </Flex>
        ),
        footer: (props) => props.column.id,
      },
      {
        accessorKey: "firstName",
        header: () => <Text>First Name</Text>,
        footer: (props) => props.column.id,
      },
      {
        accessorKey: "lastName",
        header: () => <Text>Last Name</Text>,
        footer: (props) => props.column.id,
      },
      {
        accessorKey: "age",
        header: () => <Text>Age</Text>,
        footer: (props) => props.column.id,
      },
      {
        accessorKey: "visits",
        header: () => <Text>Visits</Text>,
        footer: (props) => props.column.id,
      },
      {
        accessorKey: "status",
        header: () => <Text>Status</Text>,
        footer: (props) => props.column.id,
      },
      {
        accessorKey: "file",
        header: () => <Text>File</Text>,
        footer: (props) => props.column.id,
      },
    ],
    [],
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      expanded,
    },
    onExpandedChange: setExpanded,
    getSubRows: (row) => row.subRows,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    defaultColumn,
    // Provide our updateData function to our table meta
    meta: {updateData},
    debugTable: true,
  });

  // rows are the currently expanded rows...
  const {rows, flatRows, rowsById} = table.getRowModel();
  const {rowIdToFlatRowIndex} = useMemo(() => {
    const rowIdToFlatRowIndex: Record<string, number> = {};
    let i = 0;
    for (const flatRow of flatRows) {
      rowIdToFlatRowIndex[flatRow.id] = i;
      i += 1;
    }
    return {rowIdToFlatRowIndex};
  }, [flatRows])

  const {visibleFlatRowNumbers} = useMemo(() => {
    const visibleFlatRowNumbers: number[] = [];
    for (const expandedRow of rows) {
      visibleFlatRowNumbers.push(rowIdToFlatRowIndex[expandedRow.id]);
    }
    return {visibleFlatRowNumbers};
  }, [rows, rowIdToFlatRowIndex])

  const moveRow = useCallback(
    (dragIndex: string, dropIndex: string) => {
      setData((prevData) => {
        // TODO: take advantage of the rows, flat rows, or rowsById to improve
        //  performance here? Since its already invalidating when we update the
        //  data...
        // TODO: prevent a parent from being moved to within its children
        const out = moveEntityCorrectly(
          prevData,
          dragIndex.split("."),
          dropIndex.split("."),
        );
        return out;
      });
      setExpanded((prevExpanded) => {
        // TODO: handle expansion when everything is expanded (just true)
        // TODO: handle selection state when reparenting as well...
        const out = {...prevExpanded};
        if (out[dragIndex]) {
          out[dropIndex] = true;
        }
        delete out[dragIndex];
        return out;
      });
    },
    [],  // TODO: do we need the data dependency?
  );

  const numberOfColumns = columns.length;
  const numberOfRows = flatRows.length;

  // COPY STUFF
  const onAttemptCopy = useCallback(
    (content: string) => {
      navigator.clipboard.writeText(content).then(() => {
        window.alert("Copied to clipboard!")
      });
    },
    [],
  );

  const getContentOfCell = useCallback(
    // TODO: this could cause re-renders at child levels as data changes,
    //  so we may need to implement this in a different way with a call back or something
    //  IDEA: make this just return a copy and paste range, and then have a top level
    //   engine deal with this (at this level) instead of drilling down to cell
    (cell: SpreadsheetSelectionCell): string => {
      return '';
      // TODO:
      const row = flatRows[cell.row];
      if (row) {
        const tableCell = row.getAllCells()[cell.column];
        if (tableCell) {
          return (tableCell.getValue() || "").toString();
        }
      }
      return '';
    },
    []
    // [flatRows],
  );

  const {
    editCell,
    enableEdit,
    disableEdit,
    isEditing,
    inputPosition,
  } = useEditableCell();

  // Using the standardized, headless spreadsheet selection hook.
  const {
    gridOnKeyDown,
    gridRef,
    bodyCellSelected,
    bodyCellRangeData,
    bodyCellOnInteract,
    bodyCellOnMouseEnter,
    headerCellSelectedCells,
    headerCellOnClick,
  } = useSpreadsheetSelection({
    numberOfRows,
    numberOfColumns,
    onAttemptCopy,
    getContentOfCell,
    visibleRowNumbers: visibleFlatRowNumbers,
    isEditing,
  });

  return (
    <SpreadsheetGridProvider
      value={{
        bodyCellSelected,
        bodyCellRangeData,
        bodyCellOnInteract,
        bodyCellOnMouseEnter,
        headerCellSelectedCells,
        headerCellOnClick,
      }}
    >
      <TableContextProvider
        value={{
          rows,
          rowIdToFlatRowIndex,
          rowsById,
          moveRow,
          enableEdit,
          disableEdit,
        }}
      >
        <Flex direction="column" gap={2} padding={1}>
          <Heading fontSize="xl">TanStack Table Mega-Demo</Heading>
          <Text>Select rows, expand/collapse rows, reorder rows, select cell ranges, double click to edit cells with
            dynamic widths!</Text>
          <Flex gap={1} alignItems="center">
            <Box>
              <FormControl>
                <FormLabel fontSize="sm">Top level data size</FormLabel>
                <NumberInput
                  size="sm"
                  value={dataSize}
                  min={2}
                  max={2000}
                  onChange={(_, newNum) => setDataSize(newNum)}
                  width="150px"
                >
                  <NumberInputField/>
                  <NumberInputStepper>
                    <NumberIncrementStepper/>
                    <NumberDecrementStepper/>
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
            </Box>
            <Box>
              <FormControl>
                <FormLabel fontSize="sm">Child depth 1</FormLabel>
                <NumberInput
                  size="sm"
                  value={childDepth1}
                  min={1}
                  max={10}
                  onChange={(_, newNum) => setChildDepth1(newNum)}
                  width="150px"
                >
                  <NumberInputField/>
                  <NumberInputStepper>
                    <NumberIncrementStepper/>
                    <NumberDecrementStepper/>
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
            </Box>
            <Box>
              <FormControl>
                <FormLabel fontSize="sm">Child depth 2</FormLabel>
                <NumberInput
                  size="sm"
                  value={childDepth2}
                  min={0}
                  max={10}
                  onChange={(_, newNum) => setChildDepth2(newNum)}
                  width="150px"
                >
                  <NumberInputField/>
                  <NumberInputStepper>
                    <NumberIncrementStepper/>
                    <NumberDecrementStepper/>
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
            </Box>
            <Box>
              <Button colorScheme="teal" onClick={() => refreshData()}>Refresh Data</Button>
            </Box>
            <Text fontSize="lg">{flatRows.length} total rows</Text>
          </Flex>
          <Box
            style={{height: "800px", overflow: "auto"}}
            ref={gridRef}
            onKeyDown={(event) => {
              // TODO: build out more of this
              if (false) {
                event.preventDefault();
              } else {
                gridOnKeyDown(event);
              }
            }}
          >
            <TableVirtuoso
              style={{height: "100%", width: "100%"}}
              totalCount={rows.length}
              components={{
                Table: TableComponent,
                TableRow: TableRowComponent,
              }}
              fixedHeaderContent={() => {
                return table.getHeaderGroups().map((headerGroup) => (
                  <Tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <Th key={header.id} colSpan={header.colSpan} padding="6px">
                          {header.isPlaceholder ? null : (
                            <Box>
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                              {header.column.getCanFilter() ? (
                                <Box>
                                  <Filter column={header.column} table={table}/>
                                </Box>
                              ) : null}
                            </Box>
                          )}
                        </Th>
                      );
                    })}
                  </Tr>
                ));
              }}
            />
            {isEditing && Boolean(editCell) && Boolean(inputPosition) && (
              <EditableCell cell={editCell} cellRect={inputPosition} commitData={updateData} closeEdit={disableEdit}/>
            )}
          </Box>
        </Flex>
      </TableContextProvider>
    </SpreadsheetGridProvider>
  );
};
