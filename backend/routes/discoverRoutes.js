// routes/discoverRoutes.js -- CHECK THIS
const express = require("express");
const router = express.Router();
const { getDiscover } = require("../controllers/discoverController");

router.get("/", getDiscover);

module.exports = router;
