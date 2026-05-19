const prisma = require("../prismaClient");

async function getAllReservations(req, res) {
  try {
    const reservations = await prisma.reservation.findMany({
      include: {
        user: true,
        parkingSpot: true,
      },
      orderBy: { id: "desc" },
    });

    res.json(reservations);
  } catch (error) {
    res.status(500).json({ message: "Błąd podczas pobierania rezerwacji", error: error.message });
  }
}

async function createReservation(req, res) {
  try {
    const { userId, parkingSpotId, startTime, endTime } = req.body;

    if (!userId || !parkingSpotId || !startTime || !endTime) {
      return res.status(400).json({ message: "Podaj userId, parkingSpotId, startTime i endTime" });
    }

    const spot = await prisma.parkingSpot.findUnique({
      where: { id: Number(parkingSpotId) },
    });

    if (!spot) {
      return res.status(404).json({ message: "Nie znaleziono miejsca parkingowego" });
    }

    if (spot.status !== "FREE") {
      return res.status(400).json({ message: "To miejsce nie jest wolne" });
    }

    const reservation = await prisma.reservation.create({
      data: {
        userId: Number(userId),
        parkingSpotId: Number(parkingSpotId),
        startTime: new Date(startTime),
        endTime: new Date(endTime),
      },
      include: {
        user: true,
        parkingSpot: true,
      },
    });

    await prisma.parkingSpot.update({
      where: { id: Number(parkingSpotId) },
      data: { status: "RESERVED" },
    });

    res.status(201).json(reservation);
  } catch (error) {
    res.status(500).json({ message: "Błąd podczas tworzenia rezerwacji", error: error.message });
  }
}

module.exports = {
  getAllReservations,
  createReservation,
};
