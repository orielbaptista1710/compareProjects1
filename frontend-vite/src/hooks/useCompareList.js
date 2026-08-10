// this hook is used to manage the compare list state
// it also saves the state to localStorage

//frontend-vite/src/hooks/useCompareList.js
import { useState, useEffect } from "react"; 

export default function useCompareList() { 
  const [compareList, setCompareList] = useState(() => {
    try {
      const saved = localStorage.getItem("compareList");
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error("Failed to parse compare list:", error);
      return [];
    }
  });

  // Save to localStorage safely
  useEffect(() => {
    try {
      localStorage.setItem("compareList", JSON.stringify(compareList));
    } catch (error) {
      console.error("Failed to save compare list:", error);
    }
  }, [compareList]);

  // Add property (max 4)
  const addToCompare = (property) => {
    if (compareList.find((p) => p._id === property._id)) return;

    if (compareList.length >= 4) {
      return;
    }

    setCompareList((prev) => [...prev, property]);
  };

  // Remove property
  const removeFromCompare = (id) => {
    setCompareList((prev) => prev.filter((p) => p._id !== id));
  };

  //  now also returning setCompareList
  return { compareList, setCompareList, addToCompare, removeFromCompare };
}
