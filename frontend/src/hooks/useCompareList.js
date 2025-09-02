import { useState, useEffect } from "react"; 
import { toast } from "react-toastify";

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
      toast.error("You can only compare up to 4 properties.");
      return;
    }

    setCompareList((prev) => [...prev, property]);
    toast.success("Property added to compare list!");
  };

  // Remove property
  const removeFromCompare = (id) => {
    setCompareList((prev) => prev.filter((p) => p._id !== id));
    toast.info("Property removed from compare list.");
  };

  // ✅ now also returning setCompareList
  return { compareList, setCompareList, addToCompare, removeFromCompare };
}
