const express = require("express");
const {
  getAllSpots,
  createSpot,
  updateSpotStatus,
} = require("../controllers/spots.controller");

const router = express.Router();

router.get("/", getAllSpots);
router.post("/", createSpot);
router.patch("/:id/status", updateSpotStatus);

module.exports = router;
