export function navigateTree(root, indices) {
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

export function moveEntityCorrectly(root, originalLocation, newLocation) {
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
