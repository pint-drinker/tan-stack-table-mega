import React, {HTMLProps} from "react";
import {Checkbox} from "@chakra-ui/react";

export function IndeterminateCheckbox({
  indeterminate,
  className = "",
  ...rest
}: { indeterminate?: boolean } & HTMLProps<HTMLInputElement>) {
  // TODO: do we need the ref nonsense?
  return (
    <Checkbox
      isChecked={rest.checked}
      isIndeterminate={indeterminate}
      onChange={rest.onChange}
      className={className + " cursor-pointer"}
    />
  );
}