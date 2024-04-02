import {
  Dispatch,
  KeyboardEventHandler,
  MouseEvent,
  MutableRefObject,
  SetStateAction,
} from 'react';

export type SpreadsheetSelectionCell = { row: number; column: number };

export interface UseSpreadsheetSelectionProps {
  numberOfRows: number;
  numberOfColumns: number;
  onAttemptCopy: (content: string) => void;
  getContentOfCell: (content: SpreadsheetSelectionCell) => string;
}

export interface SpreadsheetSelectionRangeObject {
  enclosedTop: boolean;
  enclosedBottom: boolean;
  enclosedLeft: boolean;
  enclosedRight: boolean;
  inRange: boolean;
}

export enum SpreadsheetSelectionHeaderCellType {
  COLUMN = 'COLUMN',
  ROW = 'ROW',
}

export enum SpreadsheetSelectionHeaderCellSelection {
  SOME = 'some',
  NONE = 'none',
  ALL = 'all',
}

export interface UseSpreadsheetSelectionReturns {
  // OUTPUT
  gridOnKeyDown: KeyboardEventHandler<HTMLDivElement>;
  gridRef: MutableRefObject<undefined>;
  bodyCellSelected: (cell: SpreadsheetSelectionCell) => boolean;
  bodyCellRangeData: (cell: SpreadsheetSelectionCell) => string;
  bodyCellOnInteract: (cell: SpreadsheetSelectionCell) => void;
  bodyCellOnMouseEnter: (
    cell: SpreadsheetSelectionCell,
    event: MouseEvent<HTMLDivElement, MouseEvent>,
  ) => void;
  headerCellSelectedCells: (
    type: SpreadsheetSelectionHeaderCellType,
    index: number,
  ) => SpreadsheetSelectionHeaderCellSelection;
  headerCellOnClick: (
    type: SpreadsheetSelectionHeaderCellType,
    index: number,
    event: MouseEvent<HTMLDivElement, MouseEvent>,
  ) => void;
  // STATE
  selectedCell: SpreadsheetSelectionCell | null;
  setSelectedCell: Dispatch<SetStateAction<SpreadsheetSelectionCell | null>>;
  rangeSelectedCells: SpreadsheetSelectionCell[];
  setRangeSelectedCells: Dispatch<SetStateAction<SpreadsheetSelectionCell[]>>;
  extentCell: SpreadsheetSelectionCell | null;
  setExtentCell: Dispatch<SetStateAction<SpreadsheetSelectionCell | null>>;
}
