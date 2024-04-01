import React from "react";
import ReactDOM from "react-dom/client";
import {DndProvider} from "react-dnd";
import {HTML5Backend} from "react-dnd-html5-backend";
import {ChakraProvider} from '@chakra-ui/react';

import {MegaTanTable} from "./MegaTanTable.tsx";

function App() {

  return (
    <ChakraProvider>
      <DndProvider backend={HTML5Backend}>
        <MegaTanTable/>
      </DndProvider>
    </ChakraProvider>
  );
}

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Failed to find the root element");

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App/>
  </React.StrictMode>,
);
