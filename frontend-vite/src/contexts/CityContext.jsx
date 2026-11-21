//frontend/src/contexts/CityContext.jsx

/* eslint-disable react-refresh/only-export-components */
import { useEffect, useState } from "react";

import { createContext, useContext } from "react";
export const CityContext = createContext();

export const useCity = () => {
  const ctx = useContext(CityContext);
  if (!ctx) {
    throw new Error("useCity must be used inside CityProvider");
  }
  return ctx;
};


// City shown/applied when the visitor has not chosen one yet.
export const DEFAULT_CITY = "Mumbai";

const STORAGE_KEY = "selectedCity";

// localStorage can throw (Safari private mode, blocked site data, full quota).
// This provider wraps the whole app, so storage problems must never crash it.
const readStoredCity = () => {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

export const CityProvider = ({ children }) => {
  const [city, setCity] = useState(() => readStoredCity() || DEFAULT_CITY);

  useEffect(() => {
    try {
      if (city) {
        localStorage.setItem(STORAGE_KEY, city);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // ignore: the city still works for this visit, it just isn't remembered
    }
  }, [city]);

  return (
    <CityContext.Provider value={{ city, setCity }}>
      {children}
    </CityContext.Provider>
  );
}; 


