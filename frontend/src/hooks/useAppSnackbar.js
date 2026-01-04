import { useSnackbar } from "notistack";

export default function useAppSnackbar() {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  return {
    success: (msg, options = {}) =>
      enqueueSnackbar(msg, {
        variant: "success",
        ...options,
      }),

    error: (msg, options = {}) =>
      enqueueSnackbar(msg, {
        variant: "error",
        autoHideDuration: 4000,
        ...options,
      }),

    info: (msg, options = {}) =>
      enqueueSnackbar(msg, {
        variant: "info",
        ...options,
      }),

    warning: (msg, options = {}) =>
      enqueueSnackbar(msg, {
        variant: "warning",
        ...options,
      }),

    close: (key) => closeSnackbar(key),
  };
}
