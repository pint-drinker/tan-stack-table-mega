import React, {useCallback} from "react";
import {TableVirtuoso} from "react-virtuoso";
import {
  Accordion,
  AccordionButton,
  AccordionItem,
  AccordionPanel,
  Box,
  Button,
  Flex,
  Heading, Input,
  Table,
  Td,
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

export function MegaTanTable() {
  const columns = React.useMemo<ColumnDef<Person>[]>(
    () => [
      {
        id: 'control',
        size: 120,
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

  const [data, setData] = React.useState(() => makeData(500, 5, 3));
  const refreshData = () => setData(() => makeData(500, 5, 3));

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
    // filterFromLeafRows: true,
    // maxLeafRowFilterDepth: 0,
    defaultColumn,
    // Provide our updateData function to our table meta
    meta: {
      updateData: (rowIndex, rowId, columnId, value) => {
        setData((old) => {
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

  const {rows} = table.getRowModel();

  const moveRow = useCallback(
    (dragIndex, dropIndex) => {
      setData((prevData) => {
        const out = moveEntityCorrectly(
          prevData,
          dragIndex.split("."),
          dropIndex.split("."),
        );
        return out;
      });
      setExpanded((prevExpanded) => {
        const out = {...prevExpanded};
        if (out[dragIndex]) {
          out[dropIndex] = true;
        }
        delete out[dragIndex];
        return out;
      });
    },
    [data],
  );

  return (
    <Flex direction="column" gap={2}>
      <Heading>All cells editable except for first name. Have fun reparenting!</Heading>
      <Box style={{height: "800px", overflow: "auto"}}>
        <TableVirtuoso
          style={{height: "100%", width: "100%"}}
          totalCount={rows.length}
          components={{
            Table: ({style, ...props}) => {
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
            },
            TableRow: (props) => {
              const index = props["data-index"];
              const row = rows[index];
              return (
                <DraggableTableRow
                  row={row}
                  index={index}
                  moveRow={moveRow}
                  {...props}
                />
              );
            },
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
      </Box>
      <Text fontSize="lg">{rows.length} visible rows</Text>
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
  );
}