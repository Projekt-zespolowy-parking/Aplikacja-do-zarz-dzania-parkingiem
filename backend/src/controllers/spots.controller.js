const prisma = require("../prismaClient");

async function getAllSpots(req, res) {
  try {
    const spots = await prisma.parkingSpot.findMany({
      orderBy: { id: "asc" },
    });

    res.json(spots);
  } catch (error) {
    res.status(500).json({ message: "Błąd podczas pobierania miejsc", error: error.message });
  }
}

async function createSpot(req, res) {
  try {
    const { number, level, type } = req.body;

    if (!number || level === undefined) {
      return res.status(400).json({ message: "Podaj numer miejsca oraz poziom parkingu" });
    }

    const spot = await prisma.parkingSpot.create({
      data: {
        number,
        level: Number(level),
        type: type || "STANDARD",
      },
    });

    res.status(201).json(spot);
  } catch (error) {
    res.status(500).json({ message: "Błąd podczas dodawania miejsca", error: error.message });
  }
}

async function updateSpotStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ["FREE", "OCCUPIED", "RESERVED"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Niepoprawny status miejsca" });
    }

    const spot = await prisma.parkingSpot.update({
      where: { id: Number(id) },
      data: { status },
    });

    res.json(spot);
  } catch (error) {
    res.status(500).json({ message: "Błąd podczas zmiany statusu", error: error.message });
  }
}

module.exports = {
  getAllSpots,
  createSpot,
  updateSpotStatus,
};
