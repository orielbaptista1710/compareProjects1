//routes/newsRoutes.js
import express from "express";
import { getRealEstateNews } from "../controllers/newsController.js";

const router = express.Router();

router.get("/real-estate", getRealEstateNews);

export default router;

