import { createContext, useContext } from "react";
import useCompareList from "../hooks/useCompareList";

const CompareContext = createContext();

export const CompareProvider = ({ children }) => {
  const compareState = useCompareList(); // { compareList, addToCompare, removeFromCompare }

  return (
    <CompareContext.Provider value={compareState}>
      {children}
    </CompareContext.Provider>
  );
};

export const useCompare = () => useContext(CompareContext);
