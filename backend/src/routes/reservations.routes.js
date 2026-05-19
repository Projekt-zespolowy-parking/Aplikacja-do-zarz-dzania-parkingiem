const express = require("express");
const {
  getAllReservations,
  createReservation,
} = require("../controllers/reservations.controller");

const router = express.Router();

router.get("/", getAllReservations);
router.post("/", createReservation);

module.exports = router;
