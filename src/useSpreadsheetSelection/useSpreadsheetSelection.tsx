import { useOutsideClick } from '@chakra-ui/react';
import {
  KeyboardEventHandler,
  MouseEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import { useKeyPress } from '../hooks/useKeyPress';

import {
  SpreadsheetSelectionCell,
  SpreadsheetSelectionHeaderCellType,
  UseSpreadsheetSelectionProps,
  UseSpreadsheetSelectionReturns,
} from './types';
import {
  checkColumnSelection,
  checkRowSelection,
  generateCopyPasteText,
  getCellsInRectangularRange,
  getRangeData,
  isSameCell,
  translateCell,
} from './utils';

/**
 * A utility hook to deliver headless single cell, range, drag, and arrow-key based selection for a 2D grid.  Plug and play into any table solution, such as HTML table or CSS grid.
 * @returns
 */
export const useSpreadsheetSelection = ({
  numberOfRows,
  numberOfColumns,
  onAttemptCopy,
  getContentOfCell,
  expandedState = true,
}: UseSpreadsheetSelectionProps): UseSpreadsheetSelectionReturns => {
  const [selectedCell, setSelectedCell] =
    useState<SpreadsheetSelectionCell | null>(null);
  const [rangeSelectedCells, setRangeSelectedCells] = useState<
    SpreadsheetSelectionCell[]
  >([]);
  const [extentCell, setExtentCell] = useState<SpreadsheetSelectionCell | null>(
    null,
  );
  const shiftPressed = useKeyPress('Shift');

  // Create refs to duplicate states so our event handlers don't re-render whenever the states update.
  const selectedCellRef = useRef<SpreadsheetSelectionCell | null>(null);
  const rangeSelectedCellsRef = useRef<SpreadsheetSelectionCell[]>([]);
  const extentCellRef = useRef<SpreadsheetSelectionCell | null>(null);
  const shiftPressedRef = useRef<boolean>(false);

  useEffect(() => {
    selectedCellRef.current = selectedCell;
  }, [selectedCell]);
  useEffect(() => {
    rangeSelectedCellsRef.current = rangeSelectedCells;
  }, [rangeSelectedCells]);
  useEffect(() => {
    extentCellRef.current = extentCell;
  }, [extentCell]);
  useEffect(() => {
    shiftPressedRef.current = shiftPressed;
  }, [shiftPressed]);

  /**
   * A ref used to detect external clicks and clear selection.  Place on the outmost element of the grid.
   */
  const gridRef = useRef();

  useOutsideClick({
    ref: gridRef,
    handler: () => {
      setRangeSelectedCells([]);
      setExtentCell(null);
      setSelectedCell(null);
    },
  });

  useEffect(() => {
    if (extentCell != null) {
      setRangeSelectedCells(
        getCellsInRectangularRange(
          selectedCell as SpreadsheetSelectionCell,
          extentCell,
        ),
      );
    }
  }, [selectedCell, extentCell, setRangeSelectedCells]);

  /**
   * Handler for keyboard events on the grid, including arrow keys (with and without shift), copy, paste, and select all.
   * @param event
   */
  const gridOnKeyDown = useCallback<KeyboardEventHandler<HTMLDivElement>>(
    (event) => {
      if (selectedCellRef.current != null) {
        let translateParams: SpreadsheetSelectionCell | null = null;
        switch (event.key) {
          case 'ArrowLeft':
            event.preventDefault();
            translateParams = { row: 0, column: -1 };
            break;
          case 'ArrowRight':
            event.preventDefault();
            translateParams = { row: 0, column: 1 };
            break;
          case 'ArrowDown':
            event.preventDefault();
            translateParams = { row: 1, column: 0 };
            break;
          case 'ArrowUp':
            event.preventDefault();
            translateParams = { row: -1, column: 0 };
            break;
          case 'c':
            if (event.metaKey || event.ctrlKey) {
              event.preventDefault();
              if (rangeSelectedCellsRef.current.length) {
                onAttemptCopy(
                  generateCopyPasteText(
                    rangeSelectedCellsRef.current,
                    getContentOfCell,
                  ),
                );
              } else {
                onAttemptCopy(getContentOfCell(selectedCellRef.current));
              }
            }
            break;
          case 'a':
            if (event.metaKey || event.ctrlKey) {
              event.preventDefault();
              setSelectedCell({ column: 0, row: 0 });
              setExtentCell({
                row: numberOfRows - 1,
                column: numberOfColumns - 1,
              });
            }
            break;
          default:
        }

        // Translate extent or selected cell if applicable.
        if (translateParams != null) {
          // If default press, move the selected cell.
          if (!event.shiftKey) {
            setExtentCell(null);
            setRangeSelectedCells([]);
            setSelectedCell(
              translateCell(
                selectedCellRef.current,
                translateParams,
                numberOfRows,
                numberOfColumns,
              ),
            );
          }
          // If shift press, move the extent.
          else {
            setExtentCell(
              translateCell(
                extentCellRef.current || selectedCellRef.current,
                translateParams,
                numberOfRows,
                numberOfColumns,
              ),
            );
          }
        }
      }
    },
    [getContentOfCell, numberOfColumns, numberOfRows, onAttemptCopy],
  );

  // BODY CELL STUFF ------------------------------------------------------------------------ //
  const bodyCellSelected = useCallback<
    UseSpreadsheetSelectionReturns['bodyCellSelected']
  >(
    (cell: SpreadsheetSelectionCell) => isSameCell(cell, selectedCell),
    [selectedCell],
  );
  const bodyCellRangeData = useCallback(
    (cell: SpreadsheetSelectionCell) => getRangeData(cell, rangeSelectedCells),
    [rangeSelectedCells],
  );
  const bodyCellOnInteract = useCallback((cell: SpreadsheetSelectionCell) => {
    if (!shiftPressedRef.current) {
      setSelectedCell(cell);
      setExtentCell(null);
      setRangeSelectedCells([]);
    } else {
      setExtentCell(cell);
    }
  }, []);

  const bodyCellOnMouseEnter = useCallback(
    (
      cell: SpreadsheetSelectionCell,
      event: MouseEvent<HTMLDivElement, MouseEvent>,
    ) => {
      if (selectedCellRef.current != null && event.buttons === 1) {
        setExtentCell(cell);
      }
    },
    [],
  );
  // ---------------------------------------------------------------------------------------- //
  // HEADER CELLS --------------------------------------------------------------------------- //
  const headerCellSelectedCells = useCallback<
    UseSpreadsheetSelectionReturns['headerCellSelectedCells']
  >(
    (type: SpreadsheetSelectionHeaderCellType, index: number) => {
      return type === SpreadsheetSelectionHeaderCellType.ROW
        ? checkRowSelection(
            index,
            selectedCell,
            rangeSelectedCells,
            numberOfColumns,
          )
        : checkColumnSelection(
            index,
            selectedCell,
            rangeSelectedCells,
            numberOfRows,
          );
    },
    [numberOfColumns, numberOfRows, rangeSelectedCells, selectedCell],
  );

  const headerCellOnClick = useCallback<
    UseSpreadsheetSelectionReturns['headerCellOnClick']
  >(
    (
      type: SpreadsheetSelectionHeaderCellType,
      index: number,
      event: MouseEvent<HTMLDivElement, MouseEvent>,
    ) => {
      if (type === SpreadsheetSelectionHeaderCellType.ROW) {
        if (!event.shiftKey) {
          setSelectedCell({ row: index, column: 0 });
        }
        setExtentCell({ row: index, column: numberOfColumns - 1 });
      } else {
        if (!event.shiftKey) {
          setSelectedCell({ row: 0, column: index });
        }
        setExtentCell({ row: numberOfRows - 1, column: index });
      }
    },
    [numberOfColumns, numberOfRows],
  );
  // ---------------------------------------------------------------------------------------- //

  return {
    // OUTPUTS
    gridRef,
    gridOnKeyDown,
    bodyCellSelected,
    bodyCellRangeData,
    bodyCellOnInteract,
    bodyCellOnMouseEnter,
    headerCellSelectedCells,
    headerCellOnClick,
    // STATE
    selectedCell,
    setSelectedCell,
    rangeSelectedCells,
    setRangeSelectedCells,
    extentCell,
    setExtentCell,
  };
};

/*

[DONE] gridRef
[DONE] gridOnKeyDown

[DONE] bodyCellSelected(cell) T/F
bodyCellRangeData(cell) {}
[DONE] bodyCellOnInteract(cell)
[DONE] bodyCellOnMouseOver(cell)

headerCellSelected(row/col, index)
headerCellOnClick(row/col, index)
*/
