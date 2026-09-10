// backend/fakeTests/helpers/testApp.js
import express from "express";
import cookieParser from "cookie-parser";
import adminRoutes from "../../routes/adminRoutes.js";
import errorHandler from "../../middleware/errorMiddleware.js";

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use("/api/admin", adminRoutes);
app.use(errorHandler);

export default app;
