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

/**
 * Implements a binary search for finding the nearest number in a sorted array with
 * respect to the delta input. If delta is negative, it will find the nearest less than
 * or equal to number in the array (or the minimum). If the delta is positive, it will find
 * the nearest greater than or equal to number in the array (or the maximum).
 */
const findNearestNumberWithDelta = (arr: number[], input: number, delta: number): number => {
  // If delta is zero, return the input as per the new requirement.
  if (delta === 0) return input;

  // Adjust input by adding delta to set the new target.
  const target = input + delta;

  if (arr.length === 0) {
    throw new Error("The array is empty.");
  }

  // Handle cases where the adjusted input (target) is outside the bounds of the array
  if (target >= arr[arr.length - 1]) return arr[arr.length - 1];
  if (target <= arr[0]) return arr[0];

  let start = 0;
  let end = arr.length - 1;

  while (start <= end) {
    let mid = Math.floor((start + end) / 2);

    if (arr[mid] === target) {
      return arr[mid];
    } else if (arr[mid] < target) {
      start = mid + 1;
    } else {
      end = mid - 1;
    }
  }

  // For positive deltas, if target is not found, return the next highest number.
  // For negative deltas, return the next smallest number.
  // This adjustment ensures the output is >= input + delta for positive deltas, or
  // <= input + delta for negative deltas.
  return delta > 0 ? arr[start] : arr[end];
};

export const translateCell = (
  cell: SpreadsheetSelectionCell,
  cellDelta: SpreadsheetSelectionCell,
  numberOfRows: number,
  numberOfColumns: number,
  visibleRowNumbers?: number[],
) => {
  if (!visibleRowNumbers) {
    return {
      row: limitValue(cell.row + cellDelta.row, 0, numberOfRows - 1),
      column: limitValue(cell.column + cellDelta.column, 0, numberOfColumns - 1),
    };
  } else {
    return {
      row: findNearestNumberWithDelta(visibleRowNumbers, cell.row, cellDelta.row),
      column: limitValue(cell.column + cellDelta.column, 0, numberOfColumns - 1),
    };
  }
};
