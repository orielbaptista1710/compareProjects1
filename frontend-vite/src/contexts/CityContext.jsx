//frontend/src/contexts/CityContext.jsx

/* eslint-disable react-refresh/only-export-components */
import { useEffect, useState } from "react";
// import { CityContext } from "./contextInstances/cityContextInstance";

import { createContext, useContext } from "react";

export const CityContext = createContext();

export const useCity = () => {
  const ctx = useContext(CityContext);
  if (!ctx) {
    throw new Error("useCity must be used inside CityProvider");
  }
  return ctx;
};


export const CityProvider = ({ children }) => {
  const [city, setCity] = useState(() => {
    return localStorage.getItem("selectedCity"); 
  });

  useEffect(() => {
    if (city) {
      localStorage.setItem("selectedCity", city);
    } else {
      localStorage.removeItem("selectedCity");
    }
  }, [city]);

  return (
    <CityContext.Provider value={{ city, setCity }}>
      {children}
    </CityContext.Provider>
  );
};


