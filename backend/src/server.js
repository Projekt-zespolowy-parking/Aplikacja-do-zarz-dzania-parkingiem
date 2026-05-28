const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || "WSPA_SECRET";

app.get("/", (req, res) => {
  res.json({
    message: "Parking WSPA API działa",
    endpoints: ["/api/login", "/api/spots", "/api/reservations"],
  });
});

// LOGOWANIE
app.post("/api/login", async (req, res) => {
  try {
    const { email, haslo } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ message: "Nieprawidłowy email" });
    }

    const validPassword = await bcrypt.compare(haslo, user.haslo);

    if (!validPassword) {
      return res.status(401).json({ message: "Nieprawidłowe hasło" });
    }

    const token = jwt.sign(
      {
        id: user.id,
        rola: user.rola,
      },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        imie: user.imie,
        email: user.email,
        rola: user.rola,
      },
    });
  } catch (error) {
    console.error("Błąd logowania:", error);
    res.status(500).json({ message: "Błąd serwera podczas logowania" });
  }
});

// LISTA MIEJSC
app.get("/api/spots", async (req, res) => {
  try {
    const spots = await prisma.parkingSpot.findMany({
      include: {
        reservations: true,
      },
      orderBy: {
        id: "asc",
      },
    });

    res.json(spots);
  } catch (error) {
    console.error("Błąd pobierania miejsc:", error);
    res.status(500).json({ message: "Błąd pobierania miejsc parkingowych" });
  }
});

// DODAWANIE MIEJSCA
app.post("/api/spots", async (req, res) => {
  try {
    const { numer, poziom, typ } = req.body;

    if (!numer || poziom === undefined || !typ) {
      return res.status(400).json({
        message: "Uzupełnij numer, poziom i typ miejsca",
      });
    }

    const existingSpot = await prisma.parkingSpot.findUnique({
      where: { numer },
    });

    if (existingSpot) {
      return res.status(400).json({
        message: "Miejsce o takim numerze już istnieje",
      });
    }

    const spot = await prisma.parkingSpot.create({
      data: {
        numer,
        poziom: Number(poziom),
        typ,
        status: "WOLNY",
      },
    });

    res.json(spot);
  } catch (error) {
    console.error("Błąd dodawania miejsca:", error);
    res.status(500).json({ message: "Błąd dodawania miejsca" });
  }
});

// EDYCJA MIEJSCA
app.put("/api/spots/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, typ, numer, poziom } = req.body;

    const spot = await prisma.parkingSpot.update({
      where: {
        id: Number(id),
      },
      data: {
        ...(status ? { status } : {}),
        ...(typ ? { typ } : {}),
        ...(numer ? { numer } : {}),
        ...(poziom !== undefined ? { poziom: Number(poziom) } : {}),
      },
    });

    res.json(spot);
  } catch (error) {
    console.error("Błąd edycji miejsca:", error);
    res.status(500).json({ message: "Nie udało się zaktualizować miejsca" });
  }
});

// USUWANIE MIEJSCA PARKINGOWEGO
app.delete("/api/spots/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.reservation.deleteMany({
      where: {
        parkingSpotId: Number(id),
      },
    });

    await prisma.parkingSpot.delete({
      where: {
        id: Number(id),
      },
    });

    res.json({
      message: "Miejsce zostało usunięte",
    });
  } catch (error) {
    console.error("Błąd usuwania miejsca:", error);
    res.status(500).json({ message: "Nie udało się usunąć miejsca" });
  }
});

// TWORZENIE REZERWACJI
app.post("/api/reservations", async (req, res) => {
  try {
    const { userId, parkingSpotId, dataOd, dataDo } = req.body;

    if (!userId || !parkingSpotId || !dataOd || !dataDo) {
      return res.status(400).json({
        message: "Uzupełnij wszystkie dane rezerwacji",
      });
    }

    const start = new Date(dataOd);
    const end = new Date(dataDo);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return res.status(400).json({
        message: "Nieprawidłowy format daty",
      });
    }

    if (start >= end) {
      return res.status(400).json({
        message: "Data zakończenia musi być późniejsza niż rozpoczęcia",
      });
    }

    const miejsce = await prisma.parkingSpot.findUnique({
      where: {
        id: Number(parkingSpotId),
      },
    });

    const user = await prisma.user.findUnique({
      where: {
        id: Number(userId),
      },
    });

    if (!miejsce || !user) {
      return res.status(404).json({
        message: "Nie znaleziono użytkownika lub miejsca",
      });
    }

    if (miejsce.status === "ZAJETY") {
      return res.status(400).json({
        message: "To miejsce zostało oznaczone przez administratora jako zajęte",
      });
    }

    if (miejsce.typ === "DLA_PROWADZACEGO" && user.rola === "STUDENT") {
      return res.status(403).json({
        message: "Student nie może rezerwować miejsca dla prowadzących",
      });
    }

    const conflict = await prisma.reservation.findFirst({
      where: {
        parkingSpotId: Number(parkingSpotId),
        dataOd: { lt: end },
        dataDo: { gt: start },
      },
    });

    if (conflict) {
      return res.status(400).json({
        message: "To miejsce jest już zarezerwowane w wybranym czasie",
      });
    }

    const reservation = await prisma.reservation.create({
      data: {
        userId: Number(userId),
        parkingSpotId: Number(parkingSpotId),
        dataOd: start,
        dataDo: end,
      },
      include: {
        user: true,
        parkingSpot: true,
      },
    });

    res.json({
      message: "Rezerwacja została utworzona",
      reservation,
    });
  } catch (error) {
    console.error("Błąd rezerwacji:", error);
    res.status(500).json({
      message: "Błąd serwera podczas tworzenia rezerwacji",
    });
  }
});

// LISTA WSZYSTKICH REZERWACJI — DLA ADMINA
app.get("/api/reservations", async (req, res) => {
  try {
    const reservations = await prisma.reservation.findMany({
      include: {
        user: true,
        parkingSpot: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(reservations);
  } catch (error) {
    console.error("Błąd pobierania rezerwacji:", error);
    res.status(500).json({ message: "Błąd pobierania rezerwacji" });
  }
});

// REZERWACJE KONKRETNEGO UŻYTKOWNIKA
app.get("/api/users/:userId/reservations", async (req, res) => {
  try {
    const { userId } = req.params;

    const reservations = await prisma.reservation.findMany({
      where: {
        userId: Number(userId),
      },
      include: {
        parkingSpot: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(reservations);
  } catch (error) {
    console.error("Błąd pobierania rezerwacji użytkownika:", error);
    res.status(500).json({ message: "Błąd pobierania rezerwacji użytkownika" });
  }
});

// ANULOWANIE REZERWACJI — NIE USUWA MIEJSCA PARKINGOWEGO
app.delete("/api/reservations/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const reservation = await prisma.reservation.findUnique({
      where: {
        id: Number(id),
      },
    });

    if (!reservation) {
      return res.status(404).json({
        message: "Nie znaleziono rezerwacji",
      });
    }

    await prisma.reservation.delete({
      where: {
        id: Number(id),
      },
    });

    res.json({
      message: "Rezerwacja została anulowana",
    });
  } catch (error) {
    console.error("Błąd anulowania rezerwacji:", error);
    res.status(500).json({
      message: "Nie udało się anulować rezerwacji",
    });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Serwer działa na porcie ${PORT}`);
});
