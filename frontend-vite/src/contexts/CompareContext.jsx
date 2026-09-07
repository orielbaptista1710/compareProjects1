//frontend-vite/src/contexts/CompareContext.jsx

/* eslint-disable react-refresh/only-export-components */


import useCompareList from "../hooks/useCompareList";
// import { CompareContext } from "./contextInstances/CompareContextInstance";

import { createContext, useContext } from "react";

export const CompareContext = createContext();
export const useCompare = () => {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used inside CompareProvider");
  return ctx;
};
export const CompareProvider = ({ children }) => {
  const compareState = useCompareList(); 

  return (
    <CompareContext.Provider value={compareState}>
      {children}
    </CompareContext.Provider>
  );
}; 
 