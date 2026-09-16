// src/components/CompareSync.jsx
import { useContext, useEffect, useRef } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { CustomerActivityContext } from "../contexts/CustomerActivityContext";
import { useCompare } from "../contexts/CompareContext";

const CompareSync = () => {
  const { currentUser } = useContext(AuthContext);
  const { savedCompareProperties, syncCompareList, activityReady } = useContext(CustomerActivityContext);
  const { compareList, setCompareList } = useCompare();

  const prevUserRef = useRef(null);
  const mergedRef = useRef(false); // guards the one-time merge per login
  // Armed the instant we detect a login; stays armed until the merge below actually
  // runs. Kept separate from mergedRef so arming (cheap, synchronous) and executing
  // (needs real server data) can happen in different renders without racing.
  const pendingMergeRef = useRef(false);
  const debounceRef = useRef(null);
  // True from the moment the debounce below schedules a sync until that sync
  // actually fires. Lets the unmount-flush effect know whether there's an
  // un-sent change to push immediately instead of losing it.
  const pendingSyncRef = useRef(false);
  // Kept current every render so the unmount-only effect (empty deps, so its
  // closure would otherwise be stuck on the first render's values) can read
  // the latest compareList when flushing.
  const latestCompareListRef = useRef(compareList);

  // Detect the login transition and arm the pending merge. Deliberately does NOT
  // depend on savedCompareProperties/activityReady — this only decides "did we just
  // log in", nothing about server data being ready yet.
  useEffect(() => {
    const justLoggedIn = !prevUserRef.current && currentUser;
    prevUserRef.current = currentUser;

    if (justLoggedIn && !mergedRef.current) {
      pendingMergeRef.current = true;
    }
  }, [currentUser]);

  // Execute the merge once the /my-activity fetch has actually settled for this user.
  // We wait on `activityReady` (set in CustomerActivityContext's fetch effect, in the
  // same state batch as savedCompareProperties) rather than reacting to every
  // savedCompareProperties change on some assumption about effect timing — the previous
  // version ran this merge on the very first render after login, before the server
  // list had loaded, and its own PUT sync then overwrote the real server-saved compare
  // list with just the (possibly empty) guest list.
  useEffect(() => {
    if (!pendingMergeRef.current) return;
    if (!activityReady) return;
    if (mergedRef.current) return;

    pendingMergeRef.current = false;
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
    syncCompareList(mergedIds).catch((err) =>
      console.error("CompareSync: failed to persist the post-login merge", err)
    );
  }, [activityReady, savedCompareProperties]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset both guards on logout so the merge sequence runs again on next login
  useEffect(() => {
    if (!currentUser) {
      mergedRef.current = false;
      pendingMergeRef.current = false;
    }
  }, [currentUser]);

  useEffect(() => {
    latestCompareListRef.current = compareList;
  }, [compareList]);

  const pushSync = (ids) => {
    syncCompareList(ids).catch((err) =>
      console.error("CompareSync: failed to persist a compare-list change", err)
    );
  };

  // Debounced sync whenever compareList changes for a logged-in user
  useEffect(() => {
    if (!currentUser) return;
    if (!mergedRef.current) return; // don't fire before the login merge has run

    if (debounceRef.current) clearTimeout(debounceRef.current);
    pendingSyncRef.current = true;
    debounceRef.current = setTimeout(() => {
      pendingSyncRef.current = false;
      pushSync(compareList.map((p) => p._id));
    }, 800);

    return () => clearTimeout(debounceRef.current);
  }, [compareList, currentUser]); // eslint-disable-line react-hooks/exhaustive-deps

  // Flush a still-pending debounced sync immediately on unmount (e.g. the user
  // edits the compare list and navigates away within the 800ms window) instead
  // of silently losing that change — previously the debounce effect's own
  // cleanup just cleared the timer with nothing to replace it.
  useEffect(() => {
    return () => {
      // if (true) return; // TEMP: simulate the old drop-on-unmount bug
      if (!pendingSyncRef.current) return;
      pendingSyncRef.current = false;
      clearTimeout(debounceRef.current);
      pushSync(latestCompareListRef.current.map((p) => p._id));
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
};

export default CompareSync;