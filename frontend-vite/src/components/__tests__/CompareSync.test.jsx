// src/components/__tests__/CompareSync.test.jsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";

import CompareSync from "../CompareSync";
import { AuthContext } from "../../contexts/AuthContext";
import { CustomerActivityContext } from "../../contexts/CustomerActivityContext";
import { CompareContext } from "../../contexts/CompareContext";

// CompareSync is headless (renders null), so these tests wire the three contexts
// it reads directly rather than mocking modules, and drive it purely through
// rerenders with new context values — mirroring how the values actually change
// over time as AuthContext/CustomerActivityContext resolve async work.
function Harness({
  currentUser,
  savedCompareProperties,
  activityReady,
  syncCompareList,
  compareList,
  setCompareList,
}) {
  return (
    <AuthContext.Provider value={{ currentUser }}>
      <CustomerActivityContext.Provider
        value={{ savedCompareProperties, syncCompareList, activityReady }}
      >
        <CompareContext.Provider value={{ compareList, setCompareList }}>
          <CompareSync />
        </CompareContext.Provider>
      </CustomerActivityContext.Provider>
    </AuthContext.Provider>
  );
}

const guestProp = { _id: "guest-1" };
const serverProp = { _id: "server-1" };

describe("CompareSync", () => {
  let syncCompareList;
  let setCompareList;

  beforeEach(() => {
    syncCompareList = vi.fn().mockResolvedValue(undefined);
    setCompareList = vi.fn();
  });

  it("regression: does not sync a merge to the server before the post-login activity fetch settles", () => {
    const { rerender } = render(
      <Harness
        currentUser={null}
        savedCompareProperties={[]}
        activityReady={false}
        syncCompareList={syncCompareList}
        compareList={[guestProp]}
        setCompareList={setCompareList}
      />
    );

    // User logs in, but /my-activity hasn't resolved yet: activityReady is still
    // false and savedCompareProperties is still the pre-fetch default. Before the
    // fix, the login transition alone was enough to trigger an immediate merge+PUT
    // using that empty server list, silently overwriting any real server-saved
    // compare list with just the guest's local one.
    rerender(
      <Harness
        currentUser={{ uid: "u1" }}
        savedCompareProperties={[]}
        activityReady={false}
        syncCompareList={syncCompareList}
        compareList={[guestProp]}
        setCompareList={setCompareList}
      />
    );

    expect(syncCompareList).not.toHaveBeenCalled();
    expect(setCompareList).not.toHaveBeenCalled();

    // The fetch now resolves with the real server list.
    rerender(
      <Harness
        currentUser={{ uid: "u1" }}
        savedCompareProperties={[serverProp]}
        activityReady={true}
        syncCompareList={syncCompareList}
        compareList={[guestProp]}
        setCompareList={setCompareList}
      />
    );

    expect(syncCompareList).toHaveBeenCalledTimes(1);
    expect(syncCompareList).toHaveBeenCalledWith(
      expect.arrayContaining([serverProp._id, guestProp._id])
    );

    expect(setCompareList).toHaveBeenCalledTimes(1);
    const mergedList = setCompareList.mock.calls[0][0];
    expect(mergedList.map((p) => p._id).sort()).toEqual(
      [serverProp._id, guestProp._id].sort()
    );
  });

  it("merges only once per login, even if savedCompareProperties changes again afterwards", () => {
    const { rerender } = render(
      <Harness
        currentUser={{ uid: "u1" }}
        savedCompareProperties={[serverProp]}
        activityReady={true}
        syncCompareList={syncCompareList}
        compareList={[guestProp]}
        setCompareList={setCompareList}
      />
    );

    expect(syncCompareList).toHaveBeenCalledTimes(1);

    rerender(
      <Harness
        currentUser={{ uid: "u1" }}
        savedCompareProperties={[serverProp, { _id: "server-2" }]}
        activityReady={true}
        syncCompareList={syncCompareList}
        compareList={[guestProp]}
        setCompareList={setCompareList}
      />
    );

    expect(syncCompareList).toHaveBeenCalledTimes(1);
  });

  it("re-arms the merge on the next login after a logout", () => {
    const { rerender } = render(
      <Harness
        currentUser={{ uid: "u1" }}
        savedCompareProperties={[serverProp]}
        activityReady={true}
        syncCompareList={syncCompareList}
        compareList={[guestProp]}
        setCompareList={setCompareList}
      />
    );

    expect(syncCompareList).toHaveBeenCalledTimes(1);

    rerender(
      <Harness
        currentUser={null}
        savedCompareProperties={[]}
        activityReady={false}
        syncCompareList={syncCompareList}
        compareList={[guestProp]}
        setCompareList={setCompareList}
      />
    );

    rerender(
      <Harness
        currentUser={{ uid: "u2" }}
        savedCompareProperties={[{ _id: "server-3" }]}
        activityReady={true}
        syncCompareList={syncCompareList}
        compareList={[guestProp]}
        setCompareList={setCompareList}
      />
    );

    expect(syncCompareList).toHaveBeenCalledTimes(2);
  });

  it("flushes a still-pending debounced sync immediately on unmount instead of dropping it", () => {
    // Mount already logged-in with the merge already settled, so the debounce
    // effect (not the login-merge effect) is what's under test here.
    const { rerender, unmount } = render(
      <Harness
        currentUser={{ uid: "u1" }}
        savedCompareProperties={[guestProp]}
        activityReady={true}
        syncCompareList={syncCompareList}
        compareList={[guestProp]}
        setCompareList={setCompareList}
      />
    );

    expect(syncCompareList).toHaveBeenCalledTimes(1); // the initial merge

    const updatedList = [guestProp, { _id: "guest-2" }];

    // The user adds another property. This arms the 800ms debounce but the
    // timer hasn't fired yet.
    rerender(
      <Harness
        currentUser={{ uid: "u1" }}
        savedCompareProperties={[guestProp]}
        activityReady={true}
        syncCompareList={syncCompareList}
        compareList={updatedList}
        setCompareList={setCompareList}
      />
    );

    expect(syncCompareList).toHaveBeenCalledTimes(1); // still just the merge

    // Navigate away before the 800ms debounce would have fired.
    unmount();

    expect(syncCompareList).toHaveBeenCalledTimes(2);
    expect(syncCompareList).toHaveBeenLastCalledWith(
      updatedList.map((p) => p._id)
    );
  });
});
