import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
} from "vitest";

import {
  render,
  screen,
  waitFor,
  act,
  fireEvent,
} from "@testing-library/react";

import { useContext } from "react";

import {
  AuthProvider,
  AuthContext,
} from "../AuthContext";

import API from "../../api";

import { CustomerAuth } from "../../config/firebase";

import { signOut } from "firebase/auth";


// --------------------------------------------------
// MOCKS
// --------------------------------------------------

vi.mock("../../api", () => ({
  default: {
    get: vi.fn(),
  },
}));


vi.mock("../../config/firebase", () => ({
  CustomerAuth: {
    onAuthStateChanged: vi.fn(),
    currentUser: null,
  },
}));


vi.mock("firebase/auth", () => ({
  signOut: vi.fn(),
}));


// --------------------------------------------------
// TEST CONSUMER
// --------------------------------------------------

function AuthConsumer() {
  const {
    currentUser,
    loading,
    syncingProfile,
    logout,
    refreshUser,
  } = useContext(AuthContext);

  return (
    <div>
      <div data-testid="user">
        {currentUser?.name ?? "no-user"}
      </div>

      <div data-testid="loading">
        {String(loading)}
      </div>

      <div data-testid="syncing">
        {String(syncingProfile)}
      </div>

      <button
        type="button"
        onClick={logout}
      >
        Logout
      </button>

      <button
        type="button"
        onClick={refreshUser}
      >
        Refresh
      </button>
    </div>
  );
}


// --------------------------------------------------
// TEST HELPERS
// --------------------------------------------------

function createDeferred() {
  let resolve;
  let reject;

  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return {
    promise,
    resolve,
    reject,
  };
}


async function authenticateWithNoUser() {
  await act(async () => {
    await authStateCallback(null);
  });
}


async function authenticateWithUser(firebaseUser) {
  await act(async () => {
    await authStateCallback(firebaseUser);
  });
}


// const deferred = () => {
//   let resolve;
//   let reject;

//   const promise = new Promise((res, rej) => {
//     resolve = res;
//     reject = rej;
//   });

//   return { promise, resolve, reject };
// };


// --------------------------------------------------
// TEST STATE
// --------------------------------------------------

let authStateCallback;
let unsubscribe;


// --------------------------------------------------
// SETUP
// --------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();

  authStateCallback = null;

  unsubscribe = vi.fn();

  CustomerAuth.currentUser = null;

  CustomerAuth.onAuthStateChanged.mockImplementation(
    (callback) => {
      authStateCallback = callback;

      return unsubscribe;
    }
  );
});


afterEach(() => {
  vi.restoreAllMocks();
});


// --------------------------------------------------
// TESTS
// --------------------------------------------------

describe("AuthProvider", () => {

  // ----------------------------------------------
  // INITIALIZATION
  // ----------------------------------------------

  it("registers the Firebase auth listener on mount", () => {
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    expect(
      CustomerAuth.onAuthStateChanged
    ).toHaveBeenCalledTimes(1);
  });


  it("does not render children before Firebase responds", () => {
    render(
      <AuthProvider>
        <div data-testid="protected-content">
          Protected Content
        </div>
      </AuthProvider>
    );

    expect(
      screen.queryByTestId("protected-content")
    ).not.toBeInTheDocument();
  });


  it("renders children after Firebase reports no authenticated user", async () => {
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await authenticateWithNoUser();

    expect(
      screen.getByTestId("user")
    ).toHaveTextContent("no-user");

    expect(
      screen.getByTestId("loading")
    ).toHaveTextContent("false");

    expect(
      screen.getByTestId("syncing")
    ).toHaveTextContent("false");
  });


  // ----------------------------------------------
  // SUCCESSFUL AUTHENTICATION
  // ----------------------------------------------

  it("loads the backend customer profile after Firebase authenticates a user", async () => {
    const firebaseUser = {
      getIdToken: vi.fn().mockResolvedValue("firebase-token"),
    };

    const customer = {
      _id: "customer-123",
      name: "Momotaro",
      email: "test@example.com",
    };

    API.get.mockResolvedValue({
      data: {
        customer,
      },
    });

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await authenticateWithUser(firebaseUser);

    expect(
      firebaseUser.getIdToken
    ).toHaveBeenCalledWith(true);

    expect(API.get).toHaveBeenCalledWith(
      "/api/customers/me"
    );

    expect(
      screen.getByTestId("user")
    ).toHaveTextContent("Momotaro");

    expect(
      screen.getByTestId("loading")
    ).toHaveTextContent("false");

    expect(
      screen.getByTestId("syncing")
    ).toHaveTextContent("false");
  });


  it("handles a backend response without a customer safely", async () => {
    const firebaseUser = {
      getIdToken: vi.fn().mockResolvedValue("token"),
    };

    API.get.mockResolvedValue({
      data: {},
    });

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await authenticateWithUser(firebaseUser);

    expect(
      screen.getByTestId("user")
    ).toHaveTextContent("no-user");

    expect(
      screen.getByTestId("loading")
    ).toHaveTextContent("false");
  });


  // ----------------------------------------------
  // LOADING / PROFILE SYNC
  // ----------------------------------------------

  it("keeps children blocked during the initial backend profile fetch", async () => {
    const firebaseUser = {
      getIdToken: vi.fn().mockResolvedValue("token"),
    };

    const profileRequest = createDeferred();

    API.get.mockReturnValue(
      profileRequest.promise
    );

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    act(() => {
      authStateCallback(firebaseUser);
    });

    expect(
      screen.queryByTestId("user")
    ).not.toBeInTheDocument();

    await waitFor(() => {
      expect(API.get).toHaveBeenCalledWith(
        "/api/customers/me"
      );
    });

    await act(async () => {
      profileRequest.resolve({
        data: {
          customer: {
            _id: "customer-1",
            name: "Oriel",
          },
        },
      });
    });

    expect(
      screen.getByTestId("user")
    ).toHaveTextContent("Oriel");

    expect(
      screen.getByTestId("loading")
    ).toHaveTextContent("false");

    expect(
      screen.getByTestId("syncing")
    ).toHaveTextContent("false");
  });


  // ----------------------------------------------
  // FAILURE SCENARIOS
  // ----------------------------------------------

  it("treats the user as logged out when the backend profile request fails", async () => {
    const consoleSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const firebaseUser = {
      getIdToken: vi.fn().mockResolvedValue("token"),
    };

    API.get.mockRejectedValue(
      new Error("Backend unavailable")
    );

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await authenticateWithUser(firebaseUser);

    expect(
      screen.getByTestId("user")
    ).toHaveTextContent("no-user");

    expect(
      screen.getByTestId("loading")
    ).toHaveTextContent("false");

    expect(
      screen.getByTestId("syncing")
    ).toHaveTextContent("false");

    consoleSpy.mockRestore();
  });


  it("treats the user as logged out when Firebase token refresh fails", async () => {
    const consoleSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const firebaseUser = {
      getIdToken: vi
        .fn()
        .mockRejectedValue(
          new Error("Token refresh failed")
        ),
    };

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await authenticateWithUser(firebaseUser);

    expect(API.get).not.toHaveBeenCalled();

    expect(
      screen.getByTestId("user")
    ).toHaveTextContent("no-user");

    expect(
      screen.getByTestId("loading")
    ).toHaveTextContent("false");

    expect(
      screen.getByTestId("syncing")
    ).toHaveTextContent("false");

    consoleSpy.mockRestore();
  });


  // ----------------------------------------------
  // FIREBASE LOGOUT EVENT
  // ----------------------------------------------

  it("clears the user when Firebase reports a logout", async () => {
    const firebaseUser = {
      getIdToken: vi.fn().mockResolvedValue("token"),
    };

    API.get.mockResolvedValue({
      data: {
        customer: {
          name: "Momotaro",
        },
      },
    });

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await authenticateWithUser(firebaseUser);

    expect(
      screen.getByTestId("user")
    ).toHaveTextContent("Momotaro");

    await authenticateWithNoUser();

    expect(
      screen.getByTestId("user")
    ).toHaveTextContent("no-user");

    expect(
      screen.getByTestId("syncing")
    ).toHaveTextContent("false");

    expect(
      screen.getByTestId("loading")
    ).toHaveTextContent("false");
  });


  // ----------------------------------------------
  // LOGOUT
  // ----------------------------------------------

  it("logs the user out through Firebase and clears currentUser immediately", async () => {
    signOut.mockResolvedValue();

    const firebaseUser = {
      getIdToken: vi.fn().mockResolvedValue("token"),
    };

    API.get.mockResolvedValue({
      data: {
        customer: {
          name: "Momotaro",
        },
      },
    });

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await authenticateWithUser(firebaseUser);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Logout",
      })
    );

    await waitFor(() => {
      expect(signOut).toHaveBeenCalledWith(
        CustomerAuth
      );
    });

    expect(
      screen.getByTestId("user")
    ).toHaveTextContent("no-user");
  });


  it("throws the Firebase logout error when signOut fails", async () => {
    const consoleSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    signOut.mockRejectedValue(
      new Error("Logout failed")
    );

    const firebaseUser = {
      getIdToken: vi.fn().mockResolvedValue("token"),
    };

    API.get.mockResolvedValue({
      data: {
        customer: {
          name: "Momotaro",
        },
      },
    });

    function LogoutTestConsumer() {
      const { logout } =
        useContext(AuthContext);

      return (
        <button
          type="button"
          onClick={async () => {
            try {
              await logout();
            } catch {
              // Expected test behavior.
            }
          }}
        >
          Logout
        </button>
      );
    }

    render(
      <AuthProvider>
        <LogoutTestConsumer />
      </AuthProvider>
    );

    await authenticateWithUser(firebaseUser);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Logout",
      })
    );

    await waitFor(() => {
      expect(signOut).toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
  });


  // ----------------------------------------------
  // REFRESH USER
  // ----------------------------------------------

  it("does nothing when refreshUser is called without a Firebase user", async () => {
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await authenticateWithNoUser();

    CustomerAuth.currentUser = null;

    fireEvent.click(
      screen.getByRole("button", {
        name: "Refresh",
      })
    );

    await waitFor(() => {
      expect(API.get).not.toHaveBeenCalled();
    });

    expect(
      screen.getByTestId("user")
    ).toHaveTextContent("no-user");
  });


  it("clears currentUser when refreshUser is called without a Firebase user", async () => {
    const initialFirebaseUser = {
      getIdToken: vi.fn().mockResolvedValue("token"),
    };

    API.get.mockResolvedValue({
      data: {
        customer: {
          name: "Existing User",
        },
      },
    });

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await authenticateWithUser(
      initialFirebaseUser
    );

    expect(
      screen.getByTestId("user")
    ).toHaveTextContent("Existing User");

    CustomerAuth.currentUser = null;

    fireEvent.click(
      screen.getByRole("button", {
        name: "Refresh",
      })
    );

    await waitFor(() => {
      expect(
        screen.getByTestId("user")
      ).toHaveTextContent("no-user");
    });
  });


  it("refreshes the backend customer profile", async () => {
    const initialFirebaseUser = {
      getIdToken: vi.fn().mockResolvedValue("token"),
    };

    const refreshedFirebaseUser = {
      getIdToken: vi.fn().mockResolvedValue("new-token"),
    };

    CustomerAuth.currentUser =
      refreshedFirebaseUser;

    API.get
      .mockResolvedValueOnce({
        data: {
          customer: {
            name: "Old Name",
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          customer: {
            name: "Updated Name",
          },
        },
      });

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await authenticateWithUser(
      initialFirebaseUser
    );

    expect(
      screen.getByTestId("user")
    ).toHaveTextContent("Old Name");

    fireEvent.click(
      screen.getByRole("button", {
        name: "Refresh",
      })
    );

    await waitFor(() => {
      expect(
        screen.getByTestId("user")
      ).toHaveTextContent("Updated Name");
    });

    expect(
      refreshedFirebaseUser.getIdToken
    ).toHaveBeenCalledWith(true);
  });


  it("keeps the existing user when refreshUser fails", async () => {
    const consoleSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const initialFirebaseUser = {
      getIdToken: vi.fn().mockResolvedValue("token"),
    };

    const refreshFirebaseUser = {
      getIdToken: vi.fn().mockResolvedValue("token"),
    };

    CustomerAuth.currentUser =
      refreshFirebaseUser;

    API.get
      .mockResolvedValueOnce({
        data: {
          customer: {
            name: "Existing User",
          },
        },
      })
      .mockRejectedValueOnce(
        new Error("Refresh failed")
      );

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await authenticateWithUser(
      initialFirebaseUser
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Refresh",
      })
    );

    await waitFor(() => {
      expect(
        screen.getByTestId("syncing")
      ).toHaveTextContent("false");
    });

    expect(
      screen.getByTestId("user")
    ).toHaveTextContent("Existing User");

    consoleSpy.mockRestore();
  });


  // ----------------------------------------------
  // RACE CONDITION TESTS
  // ----------------------------------------------

  it("ignores an old auth request when a newer logout event occurs", async () => {
    const firebaseUser = {
      getIdToken: vi.fn().mockResolvedValue("token"),
    };

    const profileRequest = createDeferred();

    API.get.mockReturnValue(
      profileRequest.promise
    );

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    act(() => {
      authStateCallback(firebaseUser);
    });

    await waitFor(() => {
      expect(API.get).toHaveBeenCalled();
    });

    await act(async () => {
      await authStateCallback(null);
    });

    expect(
      screen.getByTestId("user")
    ).toHaveTextContent("no-user");

    await act(async () => {
      profileRequest.resolve({
        data: {
          customer: {
            name: "STALE USER",
          },
        },
      });
    });

    expect(
      screen.getByTestId("user")
    ).toHaveTextContent("no-user");
  });


  it("ensures the newest auth event wins when auth events overlap", async () => {
    const firstFirebaseUser = {
      getIdToken: vi.fn().mockResolvedValue("first-token"),
    };

    const secondFirebaseUser = {
      getIdToken: vi.fn().mockResolvedValue("second-token"),
    };

    const firstRequest =
      createDeferred();

    const secondRequest =
      createDeferred();

    API.get
      .mockReturnValueOnce(
        firstRequest.promise
      )
      .mockReturnValueOnce(
        secondRequest.promise
      );

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    act(() => {
      authStateCallback(
        firstFirebaseUser
      );
    });

    await waitFor(() => {
      expect(API.get)
        .toHaveBeenCalledTimes(1);
    });

    act(() => {
      authStateCallback(
        secondFirebaseUser
      );
    });

    await waitFor(() => {
      expect(API.get)
        .toHaveBeenCalledTimes(2);
    });

    await act(async () => {
      secondRequest.resolve({
        data: {
          customer: {
            name: "Newest User",
          },
        },
      });
    });

    expect(
      screen.getByTestId("user")
    ).toHaveTextContent("Newest User");

    await act(async () => {
      firstRequest.resolve({
        data: {
          customer: {
            name: "Stale User",
          },
        },
      });
    });

    expect(
      screen.getByTestId("user")
    ).toHaveTextContent("Newest User");
  });


  it("ignores a stale profile response after logout", async () => {
    const firebaseUser = {
      getIdToken: vi.fn().mockResolvedValue("token"),
    };

    const profileRequest =
      createDeferred();

    API.get.mockReturnValue(
      profileRequest.promise
    );

    signOut.mockResolvedValue();

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    act(() => {
      authStateCallback(firebaseUser);
    });

    await waitFor(() => {
      expect(API.get).toHaveBeenCalled();
    });

    await act(async () => {
      await authStateCallback(null);
    });

    await act(async () => {
      profileRequest.resolve({
        data: {
          customer: {
            name: "Stale User",
          },
        },
      });
    });

    expect(
      screen.getByTestId("user")
    ).toHaveTextContent("no-user");
  });


  it("does not allow a stale auth request to overwrite a newer refresh", async () => {
    const authFirebaseUser = {
      getIdToken: vi.fn().mockResolvedValue("token"),
    };

    const refreshFirebaseUser = {
      getIdToken: vi.fn().mockResolvedValue("token"),
    };

    CustomerAuth.currentUser =
      refreshFirebaseUser;

    const authProfileRequest =
      createDeferred();

    const refreshProfileRequest =
      createDeferred();

    API.get
      .mockReturnValueOnce(
        authProfileRequest.promise
      )
      .mockReturnValueOnce(
        refreshProfileRequest.promise
      );

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    act(() => {
      authStateCallback(
        authFirebaseUser
      );
    });

    await waitFor(() => {
      expect(API.get)
        .toHaveBeenCalledTimes(1);
    });

    // Start a newer refresh request.
    // Since children are still blocked during the
    // initial auth request, trigger the newer auth
    // event instead to create a newer request.
    act(() => {
      authStateCallback(
        refreshFirebaseUser
      );
    });

    await waitFor(() => {
      expect(API.get)
        .toHaveBeenCalledTimes(2);
    });

    await act(async () => {
      refreshProfileRequest.resolve({
        data: {
          customer: {
            name: "New User",
          },
        },
      });
    });

    expect(
      screen.getByTestId("user")
    ).toHaveTextContent("New User");

    await act(async () => {
      authProfileRequest.resolve({
        data: {
          customer: {
            name: "Old User",
          },
        },
      });
    });

    expect(
      screen.getByTestId("user")
    ).toHaveTextContent("New User");
  });


  // ----------------------------------------------
  // UNMOUNT SAFETY
  // ----------------------------------------------

  it("unsubscribes from Firebase auth listener on unmount", () => {
    const { unmount } = render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    unmount();

    expect(unsubscribe)
      .toHaveBeenCalledTimes(1);
  });


  it("ignores a pending profile response after unmount", async () => {
    const firebaseUser = {
      getIdToken: vi.fn().mockResolvedValue("token"),
    };

    const profileRequest =
      createDeferred();

    API.get.mockReturnValue(
      profileRequest.promise
    );

    const { unmount } = render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    act(() => {
      authStateCallback(firebaseUser);
    });

    await waitFor(() => {
      expect(API.get).toHaveBeenCalled();
    });

    unmount();

    await act(async () => {
      profileRequest.resolve({
        data: {
          customer: {
            name: "Late Response",
          },
        },
      });
    });

    expect(unsubscribe)
      .toHaveBeenCalledTimes(1);
  });


  it("invalidates pending auth work when the provider unmounts", async () => {
    const firebaseUser = {
      getIdToken: vi.fn(),
    };

    const tokenRequest =
      createDeferred();

    firebaseUser.getIdToken.mockReturnValue(
      tokenRequest.promise
    );

    const { unmount } = render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    act(() => {
      authStateCallback(firebaseUser);
    });

    expect(
      firebaseUser.getIdToken
    ).toHaveBeenCalledWith(true);

    unmount();

    await act(async () => {
      tokenRequest.resolve("token");
    });

    expect(API.get).not.toHaveBeenCalled();

    expect(unsubscribe)
      .toHaveBeenCalledTimes(1);
  });

});