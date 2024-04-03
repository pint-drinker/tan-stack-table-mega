import {useCallback, useEffect, useState} from "react";
import {Cell} from "@tanstack/react-table";
import {Person} from "../makeData.ts";
import {Box, Input} from "@chakra-ui/react";

export type InputPosition = {
  top: number;
  left: number;
  width: number;
  height: number;
};

export const useEditableCell = () => {
  const [editCell, setEditCell] = useState<Cell<Person, unknown> | null>(null);
  const [inputPosition, setInputPosition] = useState<InputPosition>({top: 0, left: 0, width: 0, height: 0});
  const [isEditing, setIsEditing] = useState(false);

  const enableEdit = useCallback((cellInfo: Cell<Person, unknown>, cellRect: InputPosition) => {
    setEditCell(cellInfo);
    setInputPosition({top: cellRect.top, left: cellRect.left, width: cellRect.width, height: cellRect.height});
    setIsEditing(true);
  }, []);

  const disableEdit = useCallback(() => {
    setIsEditing(false);
  }, []);

  // Effect to listen for clicks outside the input to disable edit mode
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isEditing && !event.target.matches('.editable-input')) {
        disableEdit();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isEditing]);

  return {editCell, enableEdit, disableEdit, isEditing, inputPosition};
};

type EditableCellProps = {
  cell: Cell<Person, unknown>;
  cellRect: InputPosition;
  commitData: (rowId: string, columnId: string, nextValue: any) => void;
  closeEdit: () => void;
}

export const EditableCell = ({cell, cellRect, commitData, closeEdit}: EditableCellProps) => {
  const {row, getValue, column} = cell;
  const {id: rowId} = row;
  const {id: columnId} = column;
  const initialValue = getValue();

  // We need to keep and update the state of the cell normally
  const [value, setValue] = useState(initialValue);

  // When the input is blurred, we'll call our table meta's updateData function
  const commitAndClose = useCallback((e) => {
    e.stopPropagation();
    if (value !== initialValue) {
      commitData(rowId, columnId, value);
    }
    // TODO: refocus on outer cell...this means we likely need to make the edit
    //  action a part of the spreadsheet selection hook...so we have one central place
    //  to manage things
    closeEdit();
  }, [commitData, closeEdit, rowId, columnId, value, initialValue])

  // If the initialValue is changed external, sync it up with our state
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  return (
    <Box
      position="fixed"
      top={`${cellRect.top}px`}
      left={`${cellRect.left}px`}
      width={`${cellRect.width}px`}
      height={`${cellRect.height}px`}
      padding={0}
      margin={0}
      background="white"
    >
      <Input
        transition="none"
        padding={0}
        margin={0}
        border={0}
        borderRadius={0}
        height="100%"
        width="100%"
        className="editable-input"
        value={value as string}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commitAndClose}
        autoFocus={true}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === 'Tab') {
            commitAndClose(e);
          } else if (e.key === 'Esc') {
            closeEdit();
          }
        }}
      />
    </Box>
  )
};
