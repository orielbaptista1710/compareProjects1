
//frontend-vite/src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import "./global.css";
import "./index.css";
import App from "./App.jsx";
// import { SnackbarProvider } from "notistack";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* <SnackbarProvider
      maxSnack={3}
      autoHideDuration={3000}
      anchorOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
    > */}
      <App />

    {/* </SnackbarProvider> */}
  </React.StrictMode>
);

