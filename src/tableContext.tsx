import { createContext } from '@chakra-ui/react-utils';
import {Row} from "@tanstack/react-table";
import {Person} from "./makeData.ts";

const [TableContextProvider, useTableContext] = createContext<{
  rows: Row<Person>;
  rowIdToFlatRowIndex: Record<string, number>;
  rowsById: Record<string, Row<Person>>;
  moveRow: (dragRowIndex: string, dropRowIndex: string) => void;
}>({
  name: 'TanStackTableContext',
  strict: true,
  errorMessage:
    'useTableContext: `context` is undefined. Seems you attempted accessed the spreadsheet context without outside of the context of a TableContextProvider.',
});
export { TableContextProvider, useTableContext };
