// backend/fakeTests/helpers/customerRoutesApp.js
//
// Standalone app for the same reason as helpers/customerActivityApp.js:
// customerRoutes.js imports config/firebaseAdmin.js directly (not through
// protectCustomer), which calls firebase-admin's initializeApp() at import
// time using a gitignored local service-account file or an env var. Callers
// must vi.mock("../config/firebaseAdmin.js") before importing this helper.
import express from "express";
import customerRoutes from "../../routes/customerRoutes.js";
import errorHandler from "../../middleware/errorMiddleware.js";

const app = express();

app.use(express.json());
app.use("/api/customers", customerRoutes);
app.use(errorHandler);

export default app;
