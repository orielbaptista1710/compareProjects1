// routes/discoverRoutes.js
import express from "express";
const router = express.Router();

import { getDiscover } from "../controllers/discoverController.js";

/*
Endpoint:
GET /api/discover/localities

Used by footer to display locality links
*/
router.get("/localities", getDiscover);

export default router;