import { createContext, useContext, useEffect, useState } from "react";

const CityContext = createContext(null);

export const CityProvider = ({ children }) => {
  const [city, setCity] = useState(() => {
    return localStorage.getItem("selectedCity"); // can be null
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

export const useCity = () => {
  const ctx = useContext(CityContext);
  if (!ctx) {
    throw new Error("useCity must be used inside CityProvider");
  }
  return ctx;
};
