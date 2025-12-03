import { createContext, useContext } from "react";

export const SnackbarContext = createContext(null);

export const useSnackbar = () => useContext(SnackbarContext);
