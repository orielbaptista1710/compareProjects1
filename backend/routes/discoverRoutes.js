// routes/discoverRoutes.js -- CHECK THIS
import express from 'express'; 
const router = express.Router();
import { getDiscover } from '../controllers/discoverController.js';

router.get("/", getDiscover);

export default router;
