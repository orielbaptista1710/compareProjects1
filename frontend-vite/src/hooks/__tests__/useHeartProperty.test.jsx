import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import useHeartProperty from "../useHeartProperty";
import { CustomerActivityContext } from "../../contexts/CustomerActivityContext";
import { AuthContext } from "../../contexts/AuthContext";

const navigateMock = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => navigateMock,
}));

function createWrapper({ heartProperties = [], toggleHeart, currentUser }) {
  return function Wrapper({ children }) {
    return (
      <AuthContext.Provider value={{ currentUser }}>
        <CustomerActivityContext.Provider
          value={{
            heartProperties,
            toggleHeart,
          }}
        >
          {children}
        </CustomerActivityContext.Provider>
      </AuthContext.Provider>
    );
  };
}

describe("useHeartProperty", () => {
  beforeEach(() => {
    navigateMock.mockReset();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("returns true when the property object exists in heartProperties", () => {
    const toggleHeart = vi.fn();

    const wrapper = createWrapper({
      currentUser: { uid: "user-123" },
      toggleHeart,
      heartProperties: [
        {
          _id: "property-123",
          title: "Mumbai Apartment",
        },
      ],
    });

    const { result } = renderHook(
      () => useHeartProperty("property-123"),
      { wrapper }
    );

    expect(result.current.isSaved).toBe(true);
  });

  it("returns true when the property ID exists directly in heartProperties", () => {
    const toggleHeart = vi.fn();

    const wrapper = createWrapper({
      currentUser: { uid: "user-123" },
      toggleHeart,
      heartProperties: ["property-123"],
    });

    const { result } = renderHook(
      () => useHeartProperty("property-123"),
      { wrapper }
    );

    expect(result.current.isSaved).toBe(true);
  });

  it("returns false when the property is not saved", () => {
    const toggleHeart = vi.fn();

    const wrapper = createWrapper({
      currentUser: { uid: "user-123" },
      toggleHeart,
      heartProperties: ["different-property"],
    });

    const { result } = renderHook(
      () => useHeartProperty("property-123"),
      { wrapper }
    );

    expect(result.current.isSaved).toBe(false);
  });

  it("returns false when no property ID is provided", () => {
    const toggleHeart = vi.fn();

    const wrapper = createWrapper({
      currentUser: { uid: "user-123" },
      toggleHeart,
      heartProperties: ["property-123"],
    });

    const { result } = renderHook(
      () => useHeartProperty(null),
      { wrapper }
    );

    expect(result.current.isSaved).toBe(false);
  });

  it("calls toggleHeart when an authenticated user toggles a property", async () => {
    const toggleHeart = vi.fn().mockResolvedValue(undefined);

    const wrapper = createWrapper({
      currentUser: { uid: "user-123" },
      toggleHeart,
      heartProperties: [],
    });

    const { result } = renderHook(
      () => useHeartProperty("property-123"),
      { wrapper }
    );

    await act(async () => {
      await result.current.handleToggleHeart();
    });

    expect(toggleHeart).toHaveBeenCalledTimes(1);
    expect(toggleHeart).toHaveBeenCalledWith("property-123");

    // Authenticated users should not be redirected.
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("redirects an unauthenticated user to customer login", async () => {
    const toggleHeart = vi.fn();

    const wrapper = createWrapper({
      currentUser: null,
      toggleHeart,
      heartProperties: [],
    });

    const { result } = renderHook(
      () => useHeartProperty("property-123"),
      { wrapper }
    );

    await act(async () => {
      await result.current.handleToggleHeart();
    });

    // The hook waits 1500ms before navigation.
    expect(navigateMock).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(navigateMock).toHaveBeenCalledTimes(1);
    expect(navigateMock).toHaveBeenCalledWith("/customer-login");

    // An unauthenticated user should never trigger toggleHeart.
    expect(toggleHeart).not.toHaveBeenCalled();
  });

  it("does not throw when toggleHeart fails", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const error = new Error("Request failed");

    const toggleHeart = vi.fn().mockRejectedValue(error);

    const wrapper = createWrapper({
      currentUser: { uid: "user-123" },
      toggleHeart,
      heartProperties: [],
    });

    const { result } = renderHook(
      () => useHeartProperty("property-123"),
      { wrapper }
    );

    await expect(
      act(async () => {
        await result.current.handleToggleHeart();
      })
    ).resolves.not.toThrow();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Toggle heart error:",
      error
    );
  });
});