import { createContext } from '@chakra-ui/react-utils';
import {
  UseSpreadsheetSelectionReturns,
} from './useSpreadsheetSelection';

const [SpreadsheetGridProvider, useSpreadsheetGrid] = createContext<{
  bodyCellSelected: UseSpreadsheetSelectionReturns['bodyCellSelected'];
  bodyCellRangeData: UseSpreadsheetSelectionReturns['bodyCellRangeData'];
  bodyCellOnInteract: UseSpreadsheetSelectionReturns['bodyCellOnInteract'];
  bodyCellOnMouseEnter: UseSpreadsheetSelectionReturns['bodyCellOnMouseEnter'];
  headerCellSelectedCells: UseSpreadsheetSelectionReturns['headerCellSelectedCells'];
  headerCellOnClick: UseSpreadsheetSelectionReturns['headerCellOnClick'];
}>({
  name: 'SpreadsheetGridContext',
  strict: true,
  errorMessage:
    'useSpreadsheetGrid: `context` is undefined. Seems you attempted accessed the spreadsheet context without outside of the context of a SpreadsheetGridProvider.',
});
export { SpreadsheetGridProvider, useSpreadsheetGrid };
