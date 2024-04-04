# Description

This is meant to be the mega-example of using TanStack to be able to recreate a Google Sheets/Excel-like experience in the browser on large datasets.

The ideal use case for this type of spreadsheet is highly nested data that you need to edit in detail (like a BOM for an assembly in manufacturing).

# Usage

To run this example:

- `npm install` or `yarn`
- `npm run start` or `yarn start`

# What this demo implements

- TanStack table with >10,000 rows w/ multiple levels of nested data
- Performant row checkbox selection
- Performant expand/collapse nested data
- Row virtualization w/ drag and drop reorder & reparenting
- Arrow key navigation
- Cell selection and range selection (with keyboard and dragging mouse)
- Double click cell to edit
- Dynamic column widths to content size
- Filtering of columns (a little crude/janky) 

# Major features left to implement

- Drag and drop (using React DnD) items to/from specialized cells
- Drop down cells
- Copy and paste
- Additional Excel keyboard interactions (enter, tab, shift tab, scrolling w/ keyboard navigation)


## Other to-dos

*Note*: There are many ToDos littered about the code. They likely reference something in the lists above or below.

- Move triggering of cell editing to inside the `useSpreadsheetSelection` hook
- Disable spreadsheet grid keyboard navigation while actively editing
- Improve performance when navigating and bulk selecting cells with better memoization
- Improve how focus is achieved on cells when navigating
- Improve selection border styling
- Fix tab and shift + tab navigation in the sheet
- Implement enter/key press down (that is not an arrow key) to begin cell editing
- Potentially speed up how we update data when editing cell values
- Cleanup or kill the filter capabilities
- Improve the `moveRow` function to not allow moving of a parent to within it's children
- When moving rows, make the updating of row selection and expansion more consistent
- Implement `getContentOfCell` (for copy and paste)
- Generally clean up how data flows around to make hooks reusable and improve performance