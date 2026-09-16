// backend/fakeTests/helpers/customerActivityApp.js
//
// Deliberately a standalone app (not added to helpers/testApp.js) — mounting
// customerActivityRoutes pulls in protectCustomer -> config/firebaseAdmin.js,
// which calls firebase-admin's initializeApp() at import time using either
// FIREBASE_SERVICE_ACCOUNT or a local, gitignored service-account file. Wiring
// that into the shared testApp.js would make every other backend test file
// depend on Firebase credentials being present. Callers of this helper must
// vi.mock("../config/firebaseAdmin.js") before importing it.
import express from "express";
import customerActivityRoutes from "../../routes/customerActivityRoutes.js";
import errorHandler from "../../middleware/errorMiddleware.js";
 
const app = express();

app.use(express.json());
app.use("/api/customerActivity", customerActivityRoutes);
app.use(errorHandler);

export default app;
