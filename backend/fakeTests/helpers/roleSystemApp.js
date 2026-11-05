// backend/fakeTests/helpers/roleSystemApp.js
//
// App with every route the customer/agent/developer role system touches,
// including the flag-gated /api/customers/listings. Callers must
// vi.mock("../config/firebaseAdmin.js") before importing this helper (see
// helpers/customerRoutesApp.js for why).
import express from "express";
import cookieParser from "cookie-parser";
import customerRoutes from "../../routes/customerRoutes.js";
import customerListingRoutes from "../../routes/customerListingRoutes.js";
import propertyRoutes from "../../routes/propertyRoutes.js";
import adminRoutes from "../../routes/adminRoutes.js";
import errorHandler from "../../middleware/errorMiddleware.js";

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use("/api/customers/listings", customerListingRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/admin", adminRoutes);
app.use(errorHandler);

export default app;
