import {
  SpreadsheetSelectionRangeObject,
  type SpreadsheetSelectionCell,
  SpreadsheetSelectionHeaderCellSelection,
} from './types';

/**
 * Determine if a cell is identical to another cell.
 * @param rowIndex
 * @param columnIndex
 * @returns
 */
export const isSameCell = (
  cell1: SpreadsheetSelectionCell | null,
  cell2: SpreadsheetSelectionCell | null,
) => {
  return (
    cell1 != null &&
    cell2 != null &&
    cell1.row === cell2.row &&
    cell1.column === cell2.column
  );
};

/**
 * Determine if a cell is within a list of cells.
 * @param rowIndex
 * @param columnIndex
 * @returns
 */
export const isCellInList = (
  cell: SpreadsheetSelectionCell,
  range: SpreadsheetSelectionCell[],
): boolean => {
  return (
    range.findIndex((c) => c.row === cell.row && c.column === cell.column) != -1
  );
};

/**
 * Determine all cells in a rectangular region between two cells.
 * @param startCell
 * @param endCell
 * @returns
 */
export const getCellsInRectangularRange = (
  startCell: SpreadsheetSelectionCell,
  endCell: SpreadsheetSelectionCell,
): SpreadsheetSelectionCell[] => {
  const cells: SpreadsheetSelectionCell[] = [];
  for (
    let row = Math.min(startCell.row, endCell.row);
    row <= Math.max(startCell.row, endCell.row);
    row++
  ) {
    for (
      let column = Math.min(startCell.column, endCell.column);
      column <= Math.max(startCell.column, endCell.column);
      column++
    ) {
      cells.push({ row, column });
    }
  }
  return cells;
};

/**
 * Determine whether a cell is enclosed on a given side by other cells in a range.
 * @param cell
 * @param range
 * @returns
 */
export const getRangeData = (
  cell: SpreadsheetSelectionCell,
  range: SpreadsheetSelectionCell[],
): string => {
  const inRange = isCellInList(cell, range);

  const topCell: SpreadsheetSelectionCell = {
    row: cell.row - 1,
    column: cell.column,
  };
  const bottomCell: SpreadsheetSelectionCell = {
    row: cell.row + 1,
    column: cell.column,
  };
  const leftCell: SpreadsheetSelectionCell = {
    row: cell.row,
    column: cell.column - 1,
  };
  const rightCell: SpreadsheetSelectionCell = {
    row: cell.row,
    column: cell.column + 1,
  };

  const output: SpreadsheetSelectionRangeObject = {
    inRange: inRange,
    enclosedTop: range.some(
      (c) => c.row === topCell.row && c.column === topCell.column,
    ),
    enclosedBottom: range.some(
      (c) => c.row === bottomCell.row && c.column === bottomCell.column,
    ),
    enclosedLeft: range.some(
      (c) => c.row === leftCell.row && c.column === leftCell.column,
    ),
    enclosedRight: range.some(
      (c) => c.row === rightCell.row && c.column === rightCell.column,
    ),
  };

  return JSON.stringify(output);
};

/**
 * Constrain a value between a min and max value.
 * @param value
 * @param min
 * @param max
 * @returns
 */
export const limitValue = (value: number, min: number, max: number) => {
  return Math.min(Math.max(value, min), max);
};

/**
 * Determine whether none, some, or all cells in a row are selected.
 * @param rowIndex
 * @param selectedCell
 * @param rangeSelectedCells
 * @param numberOfColumns
 * @returns
 */
export const checkRowSelection = (
  rowIndex: number,
  selectedCell: SpreadsheetSelectionCell | null,
  rangeSelectedCells: SpreadsheetSelectionCell[],
  numberOfColumns: number,
): SpreadsheetSelectionHeaderCellSelection => {
  let output = SpreadsheetSelectionHeaderCellSelection.NONE;

  const countOfCells = rangeSelectedCells.filter(
    (c) => c.row === rowIndex,
  ).length;

  if (countOfCells === numberOfColumns) {
    output = SpreadsheetSelectionHeaderCellSelection.ALL;
  } else if (countOfCells > 0 || selectedCell?.row === rowIndex) {
    output = SpreadsheetSelectionHeaderCellSelection.SOME;
  }

  return output;
};

/**
 * Determine whether none, some, or all cells in a column are selected.
 * @param columnIndex
 * @param selectedCell
 * @param rangeSelectedCells
 * @param numberOfRows
 * @returns
 */
export const checkColumnSelection = (
  columnIndex: number,
  selectedCell: SpreadsheetSelectionCell | null,
  rangeSelectedCells: SpreadsheetSelectionCell[],
  numberOfRows: number,
): SpreadsheetSelectionHeaderCellSelection => {
  let output = SpreadsheetSelectionHeaderCellSelection.NONE;

  const countOfCells = rangeSelectedCells.filter(
    (c) => c.column === columnIndex,
  ).length;

  if (countOfCells === numberOfRows) {
    output = SpreadsheetSelectionHeaderCellSelection.ALL;
  } else if (countOfCells > 0 || selectedCell?.column === columnIndex) {
    output = SpreadsheetSelectionHeaderCellSelection.SOME;
  }

  return output;
};

/**
 * Sort cells by lowest row, then column order.
 * @param cells
 * @returns
 */
export const sortCellsByTopLeft = (
  cells: SpreadsheetSelectionCell[],
): SpreadsheetSelectionCell[] => {
  return cells.sort((a, b) => {
    if (a.row !== b.row) {
      return a.row - b.row; // Sort by rows first
    } else {
      return a.column - b.column; // Sort by columns if rows are equal
    }
  });
};

export const generateCopyPasteText = (
  cells: SpreadsheetSelectionCell[],
  getContentOfCell: (cell: SpreadsheetSelectionCell) => string,
): string => {
  let copyPasteText = '';
  let currentRow = cells[0].row;
  cells.forEach((cell) => {
    if (cell.row !== currentRow) {
      copyPasteText += '\n'; // Add newline character for new rows
      currentRow = cell.row;
    } else if (copyPasteText !== '') {
      copyPasteText += '\t'; // Add tab character for cells within the same row, except for the first cell
    }
    copyPasteText += getContentOfCell(cell);
  });
  return copyPasteText;
};

export const translateCell = (
  cell: SpreadsheetSelectionCell,
  cellDelta: SpreadsheetSelectionCell,
  numberOfRows: number,
  numberOfColumns: number,
) => {
  return {
    row: limitValue(cell.row + cellDelta.row, 0, numberOfRows - 1),
    column: limitValue(cell.column + cellDelta.column, 0, numberOfColumns - 1),
  };
};
