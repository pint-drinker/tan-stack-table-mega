import React, {useCallback, useMemo} from "react";
import {TableVirtuoso} from "react-virtuoso";
import {
  Accordion,
  AccordionButton,
  AccordionItem,
  AccordionPanel,
  Box,
  Button,
  Flex,
  Heading,
  Input,
  Table,
  Text,
  Th,
  Tr,
} from '@chakra-ui/react';
import { DragHandleIcon } from '@chakra-ui/icons'

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

const SAMPLE_DATA_SIZE = 500;

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
  const columns = React.useMemo<ColumnDef<Person>[]>(
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
        accessorFn: (row) => row.firstName,
        id: "firstName",
        header: () => <Text>First Name</Text>,
        footer: (props) => props.column.id,
      },
      {
        accessorFn: (row) => row.lastName,
        id: "lastName",
        header: () => <Text>Last Name</Text>,
        footer: (props) => props.column.id,
      },
      {
        accessorKey: "age",
        id: "name",
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
        header: "Status",
        footer: (props) => props.column.id,
      },
      {
        accessorKey: "progress",
        header: "Profile Progress",
        footer: (props) => props.column.id,
      },
    ],
    [],
  );

  const [data, setData] = React.useState(() => makeData(SAMPLE_DATA_SIZE, 5, 3));
  const refreshData = () => setData(() => makeData(SAMPLE_DATA_SIZE, 5, 3));

  const [expanded, setExpanded] = React.useState<ExpandedState>({});

  // Give our default column cell renderer editing superpowers!
  const defaultColumn: Partial<ColumnDef<Person>> = {
    cell: ({getValue, row, column, table}) => {
      const {index, id: rowId} = row;
      const {id: columnId} = column;
      const initialValue = getValue();
      // We need to keep and update the state of the cell normally
      const [value, setValue] = React.useState(initialValue);

      // When the input is blurred, we'll call our table meta's updateData function
      const onBlur = () => {
        if (value !== initialValue) {
          table.options.meta?.updateData(index, rowId, columnId, value);
        }
      };

      // If the initialValue is changed external, sync it up with our state
      React.useEffect(() => {
        setValue(initialValue);
      }, [initialValue]);

      // TODO: is chakra input not as fast?
      // TODO: implement a separate editable component that activates when typing
      //  in the cell or hitting enter...like google sheets
      return <Text>{value}</Text>
      return (
        <Input value={value as string} onChange={(e) => setValue(e.target.value)} onBlur={onBlur}/>
      )
    },
  };

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
    meta: {
      updateData: (rowIndex, rowId, columnId, value) => {
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
      },
    },
    debugTable: true,
  });

  const {rows, flatRows, rowsById} = table.getRowModel();
  const { rowIdToFlatRowIndex } = useMemo(() => {
    const t1 = performance.now()
    const rowIdToFlatRowIndex: Record<string, number> = {};
    for (const flatRowIndex in flatRows) {
      const row = flatRows[flatRowIndex];
      rowIdToFlatRowIndex[row.id] = flatRowIndex
    }
    console.log('flat rows changing', performance.now() - t1)
    return { rowIdToFlatRowIndex };
  }, [flatRows])

  const moveRow = useCallback(
    (dragIndex: string, dropIndex: string) => {
      setData((prevData) => {
        // TODO: take advantage of the rows, flat rows, or rowsById to improve
        //  performance here? Since its already invalidating when we update the
        //  data...
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
          rowIdToFlatRowIndex,
          rowsById,
          rows,
          moveRow,
        }}
      >
        <Flex direction="column" gap={2}>
          <Heading>All cells editable. Have fun reparenting!</Heading>
          <Box
            style={{height: "800px", overflow: "auto"}}
            ref={gridRef}
            onKeyDown={(event) => {
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
              // TODO: use ItemContent?
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
          </Box>
          <Text fontSize="lg">{flatRows.length} total rows</Text>
          <Box>
            <Button colorScheme="teal" onClick={() => refreshData()}>Refresh Data</Button>
          </Box>
          <Accordion allowToggle={true}>
            <AccordionItem>
              <AccordionButton>
                <Box as="span" flex='1' textAlign='left'>
                  State details
                </Box>
              </AccordionButton>
              <AccordionPanel>
                <label>Expanded State:</label>
                <pre>{JSON.stringify(expanded, null, 2)}</pre>
                <label>Row Selection State:</label>
                <pre>{JSON.stringify(table.getState().rowSelection, null, 2)}</pre>
              </AccordionPanel>
            </AccordionItem>
          </Accordion>
        </Flex>
      </TableContextProvider>
    </SpreadsheetGridProvider>
  );
}