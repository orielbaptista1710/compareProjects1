//routes/newsRoutes.js
import express from "express";
import { getRealEstateNews } from "../controllers/newsController.js";
import { publicLimiter } from "../middleware/rateLimiters.js";

const router = express.Router();

router.get("/real-estate", publicLimiter, getRealEstateNews);

export default router;

