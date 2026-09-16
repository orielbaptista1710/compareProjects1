// backend/fakeTests/helpers/testApp.js
import express from "express";
import cookieParser from "cookie-parser";
import adminRoutes from "../../routes/adminRoutes.js";
import authRoutes from "../../routes/authRoutes.js";
import propertyRoutes from "../../routes/propertyRoutes.js";
import errorHandler from "../../middleware/errorMiddleware.js";

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/properties", propertyRoutes);
app.use(errorHandler);

export default app;
