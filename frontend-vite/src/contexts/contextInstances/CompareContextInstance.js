import { createContext, useContext } from "react";

export const CompareContext = createContext();

export const useCompare = () => useContext(CompareContext);
