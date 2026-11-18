// features/developer-dashboard/property-form/hooks/sectionStatusContext.js
// The sections' progress (done / to fix / can publish), shared with the few
// components that show it. See SectionStatusProvider for why it's a context.
import { createContext, useContext } from "react";

export const SectionStatusContext = createContext(null);

export const useSectionStatusContext = () => {
  const status = useContext(SectionStatusContext);
  if (!status) throw new Error("useSectionStatusContext must be used inside SectionStatusProvider");
  return status;
};
