// features/developer-dashboard/property-form/components/SectionStatusProvider.jsx
// Computes the form's progress and hands it to whoever needs it.
//
// useSectionStatus watches the whole form and re-validates it on every change.
// Called in SellPropertyForm itself, every keystroke re-rendered the whole page:
// all the section cards, the header, the preview. Calling it here means only
// this component re-renders per keystroke. `children` is created by
// SellPropertyForm, which no longer re-renders, so React reuses those same
// elements and skips everything that doesn't read the context (only the
// header's Publish button and the checklist do).
import { SectionStatusContext } from "../hooks/sectionStatusContext";
import { useSectionStatus } from "../hooks/useSectionStatus";

const SectionStatusProvider = ({ control, openId, visited, sections, schema, children }) => {
  const status = useSectionStatus(control, { openId, visited, sections, schema });
  return <SectionStatusContext.Provider value={status}>{children}</SectionStatusContext.Provider>;
};

export default SectionStatusProvider;
