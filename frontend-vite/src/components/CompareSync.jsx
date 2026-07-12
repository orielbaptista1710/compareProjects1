// src/components/CompareSync.jsx
import { useContext, useEffect, useRef } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { CustomerActivityContext } from "../contexts/CustomerActivityContext";
import { useCompare } from "../contexts/CompareContext";

const CompareSync = () => {
  const { currentUser } = useContext(AuthContext);
  const { savedCompareProperties, syncCompareList } = useContext(CustomerActivityContext);
  const { compareList, setCompareList } = useCompare();

  const prevUserRef = useRef(null);
  const mergedRef = useRef(false); // guards the one-time merge per login
  const debounceRef = useRef(null);

  // Merge guest list with server list exactly once, right after login
  useEffect(() => {
    const justLoggedIn = !prevUserRef.current && currentUser;
    prevUserRef.current = currentUser;

    if (!justLoggedIn) return;
    if (mergedRef.current) return;

    // savedCompareProperties may still be loading; wait a tick via the
    // effect below re-running once it populates
    mergedRef.current = true;

    const guestIds = compareList.map((p) => p._id);
    const serverProps = savedCompareProperties || [];
    const serverIds = serverProps.map((p) => p._id);

    const mergedIds = Array.from(new Set([...serverIds, ...guestIds])).slice(0, 4);

    if (mergedIds.length === 0) return;

    // Build merged property objects (prefer full server objects, fall back to guest ones)
    const byId = new Map([...serverProps, ...compareList].map((p) => [p._id, p]));
    const mergedList = mergedIds.map((id) => byId.get(id)).filter(Boolean);

    setCompareList(mergedList);
    syncCompareList(mergedIds).catch(() => {});
  }, [currentUser, savedCompareProperties]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset the merge guard on logout so it merges again on next login
  useEffect(() => {
    if (!currentUser) mergedRef.current = false;
  }, [currentUser]);

  // Debounced sync whenever compareList changes for a logged-in user
  useEffect(() => {
    if (!currentUser) return;
    if (!mergedRef.current) return; // don't fire before the login merge has run

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const ids = compareList.map((p) => p._id);
      syncCompareList(ids).catch(() => {});
    }, 800);

    return () => clearTimeout(debounceRef.current);
  }, [compareList, currentUser]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
};

export default CompareSync;