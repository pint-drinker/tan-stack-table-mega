import React, { HTMLProps, useCallback } from "react";
import ReactDOM from "react-dom/client";
import { TableVirtuoso } from "react-virtuoso";
import { useDrag, useDrop, DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

import "./index.css";

import {
  Column,
  Table,
  ExpandedState,
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getExpandedRowModel,
  ColumnDef,
  flexRender,
} from "@tanstack/react-table";
import { makeData, Person } from "./makeData";

function navigateTree(root, indices) {
  // Starting at the root of the tree (the main factory floor)
  let currentNode = root[indices[0]];

  // Follow the directions, one section at a time
  for (const index of indices.splice(1)) {
    // Check if the direction leads to a valid section
    if (currentNode.subRows[index] === undefined) {
      throw new Error("Invalid path: reached a dead-end at index " + index);
    }
    // Move to the next section
    currentNode = currentNode.subRows[index];
  }

  // Return the machine (element) found at the end of the path
  return currentNode;
}

function moveEntityCorrectly(root, originalLocation, newLocation) {
  // Deeply clone the structure to avoid mutating the original data
  let clonedRoot = JSON.parse(JSON.stringify(root));

  // Utility to navigate to a specific location in the structure
  function navigateToLocation(data, location) {
    let current = data;
    for (let i = 0; i < location.length - 1; i++) {
      current = current[location[i]].subRows;
    }
    return current;
  }

  // Remove the entity from its original location
  let parentOriginal = navigateToLocation(clonedRoot, originalLocation);
  let entity = parentOriginal.splice(
    originalLocation[originalLocation.length - 1],
    1,
  )[0];

  // If the removal affects the new location indices, adjust the new location
  if (
    originalLocation.slice(0, -1).join(",") ===
      newLocation.slice(0, -1).join(",") &&
    originalLocation[originalLocation.length - 1] <
      newLocation[newLocation.length - 1]
  ) {
    newLocation[newLocation.length - 1]--;
  }

  // Insert the entity into its new location
  let parentNew = navigateToLocation(clonedRoot, newLocation);
  parentNew.splice(newLocation[newLocation.length - 1], 0, entity);

  return clonedRoot;
}

function DraggableTableRow({ row, index, moveRow, ...props }) {
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

  const [{ isDragging }, drag] = useDrag({
    type: "row",
    item: () => {
      return { index, row };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));

  return (
    <tr
      ref={ref}
      {...props}
      style={{
        ...props.style,
        opacity: isDragging ? 0 : 1,
      }}
    >
      {props.children}
    </tr>
  );
}

function App() {
  const rerender = React.useReducer(() => ({}), {})[1];

  const columns = React.useMemo<ColumnDef<Person>[]>(
    () => [
      {
        accessorKey: "firstName",
        header: ({ table }) => (
          <>
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
            </button>{" "}
            First Name
          </>
        ),
        cell: ({ row, getValue }) => (
          <div
            style={{
              // Since rows are flattened by default,
              // we can use the row.depth property
              // and paddingLeft to visually indicate the depth
              // of the row
              paddingLeft: `${row.depth * 2}rem`,
            }}
          >
            <div>
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
                    style: { cursor: "pointer" },
                  }}
                >
                  {row.getIsExpanded() ? "👇" : "👉"}
                </button>
              ) : (
                "🔵"
              )}{" "}
              {getValue<boolean>()}
            </div>
          </div>
        ),
        footer: (props) => props.column.id,
      },
      {
        accessorFn: (row) => row.lastName,
        id: "lastName",
        header: () => <span>Last Name</span>,
        footer: (props) => props.column.id,
      },
      {
        accessorKey: "age",
        header: () => "Age",
        footer: (props) => props.column.id,
      },
      {
        accessorKey: "visits",
        header: () => <span>Visits</span>,
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
    cell: ({ getValue, row, column, table }) => {
      const { index, id: rowId } = row;
      const { id: columnId } = column;
      const initialValue = getValue();
      // We need to keep and update the state of the cell normally
      const [value, setValue] = React.useState(initialValue);

      // When the input is blurred, we'll call our table meta's updateData function
      const onBlur = () => {
        table.options.meta?.updateData(index, rowId, columnId, value);
      };

      // If the initialValue is changed external, sync it up with our state
      React.useEffect(() => {
        setValue(initialValue);
      }, [initialValue]);

      return (
        <input
          value={value as string}
          onChange={(e) => setValue(e.target.value)}
          onBlur={onBlur}
        />
      );
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

  const { rows } = table.getRowModel();

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
        const out = { ...prevExpanded };
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
    <DndProvider backend={HTML5Backend}>
      <div className="p-2">
        <div>All cells editable except first name. Have fun reparenting!</div>
        <div style={{ height: "800px", overflow: "auto" }}>
          <TableVirtuoso
            style={{ height: "100%", width: "100%" }}
            totalCount={rows.length}
            components={{
              Table: ({ style, ...props }) => {
                return (
                  <table
                    {...props}
                    style={{
                      ...style,
                      width: "100%",
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
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} style={{ padding: "6px" }}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </DraggableTableRow>
                );
              },
            }}
            fixedHeaderContent={() => {
              return table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <th key={header.id} colSpan={header.colSpan}>
                        {header.isPlaceholder ? null : (
                          <div>
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                            {header.column.getCanFilter() ? (
                              <div>
                                <Filter column={header.column} table={table} />
                              </div>
                            ) : null}
                          </div>
                        )}
                      </th>
                    );
                  })}
                </tr>
              ));
            }}
          />
        </div>
        <div>{rows.length} Rows</div>
        <div>
          <button onClick={() => rerender()}>Force Rerender</button>
        </div>
        <div>
          <button onClick={() => refreshData()}>Refresh Data</button>
        </div>
        <label>Expanded State:</label>
        <pre>{JSON.stringify(expanded, null, 2)}</pre>
        <label>Row Selection State:</label>
        <pre>{JSON.stringify(table.getState().rowSelection, null, 2)}</pre>
      </div>
    </DndProvider>
  );
}

function Filter({
  column,
  table,
}: {
  column: Column<any, any>;
  table: Table<any>;
}) {
  const firstValue = table
    .getPreFilteredRowModel()
    .flatRows[0]?.getValue(column.id);

  const columnFilterValue = column.getFilterValue();

  return typeof firstValue === "number" ? (
    <div className="flex space-x-2">
      <input
        type="number"
        value={(columnFilterValue as [number, number])?.[0] ?? ""}
        onChange={(e) =>
          column.setFilterValue((old: [number, number]) => [
            e.target.value,
            old?.[1],
          ])
        }
        placeholder={`Min`}
        className="w-24 border shadow rounded"
      />
      <input
        type="number"
        value={(columnFilterValue as [number, number])?.[1] ?? ""}
        onChange={(e) =>
          column.setFilterValue((old: [number, number]) => [
            old?.[0],
            e.target.value,
          ])
        }
        placeholder={`Max`}
        className="w-24 border shadow rounded"
      />
    </div>
  ) : (
    <input
      type="text"
      value={(columnFilterValue ?? "") as string}
      onChange={(e) => column.setFilterValue(e.target.value)}
      placeholder={`Search...`}
      className="w-36 border shadow rounded"
    />
  );
}

function IndeterminateCheckbox({
  indeterminate,
  className = "",
  ...rest
}: { indeterminate?: boolean } & HTMLProps<HTMLInputElement>) {
  const ref = React.useRef<HTMLInputElement>(null!);

  React.useEffect(() => {
    if (typeof indeterminate === "boolean") {
      ref.current.indeterminate = !rest.checked && indeterminate;
    }
  }, [ref, indeterminate]);

  return (
    <input
      type="checkbox"
      ref={ref}
      className={className + " cursor-pointer"}
      {...rest}
    />
  );
}

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Failed to find the root element");

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
