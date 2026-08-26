//contextInstances/cityContextInstance.js
import { createContext, useContext } from "react";

export const CityContext = createContext();

export const useCity = () => {
  const ctx = useContext(CityContext);
  if (!ctx) {
    throw new Error("useCity must be used inside CityProvider");
  }
  return ctx;
};