import { useState, useCallback } from "react";
import { Snackbar, Alert } from "@mui/material";

export default function useSnackbar() {
  const [snack, setSnack] = useState({
    open: false,
    message: "",
    severity: "success", // success | error | info | warning
  });

  const showSuccess = useCallback((message = "Success!") => {
    setSnack({ open: true, message, severity: "success" });
  }, []);

  const showError = useCallback((message = "Something went wrong.") => {
    setSnack({ open: true, message, severity: "error" });
  }, []);

  const showInfo = useCallback((message) => {
    setSnack({ open: true, message, severity: "info" });
  }, []);

  const showWarning = useCallback((message) => {
    setSnack({ open: true, message, severity: "warning" });
  }, []);

  const handleClose = () => {
    setSnack((prev) => ({ ...prev, open: false }));
  };

  // Component you will render inside your component
  const SnackbarUI = () => (
    <Snackbar
      open={snack.open}
      autoHideDuration={3000}
      onClose={handleClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
    >
      <Alert onClose={handleClose} severity={snack.severity} variant="filled">
        {snack.message}
      </Alert>
    </Snackbar>
  );

  return { showSuccess, showError, showInfo, showWarning, SnackbarUI };
}
