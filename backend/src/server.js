const express = require("express");
const cors = require("cors");
require("dotenv").config();

const spotsRoutes = require("./routes/spots.routes");
const reservationsRoutes = require("./routes/reservations.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Parking Management API działa",
    endpoints: ["/api/spots", "/api/reservations"],
  });
});

app.use("/api/spots", spotsRoutes);
app.use("/api/reservations", reservationsRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Serwer działa na porcie ${PORT}`);
});
