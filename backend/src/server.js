const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

const JWT_SECRET = "WSPA_SECRET";

app.get("/", (req, res) => {
  res.json({
    message: "Parking WSPA API działa",
  });
});

// LOGOWANIE
app.post("/api/login", async (req, res) => {
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
    JWT_SECRET
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
});

// LISTA MIEJSC
app.get("/api/spots", async (req, res) => {
  const spots = await prisma.parkingSpot.findMany({
    orderBy: {
      id: "asc",
    },
  });

  res.json(spots);
});

// DODAWANIE MIEJSCA
app.post("/api/spots", async (req, res) => {
  const { numer, poziom, typ } = req.body;

  if (!numer || poziom === undefined || !typ) {
    return res.status(400).json({
      message: "Uzupełnij numer, poziom i typ miejsca",
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
});

// EDYCJA MIEJSCA
app.put("/api/spots/:id", async (req, res) => {
  const { id } = req.params;
  const { status, typ } = req.body;

  const spot = await prisma.parkingSpot.update({
    where: {
      id: Number(id),
    },
    data: {
      status,
      typ,
    },
  });

  res.json(spot);
});

// USUWANIE MIEJSCA
app.delete("/api/spots/:id", async (req, res) => {
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
});

// TWORZENIE REZERWACJI
app.post("/api/reservations", async (req, res) => {
  const { userId, parkingSpotId, dataOd, dataDo } = req.body;

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

  if (miejsce.status !== "WOLNY") {
    return res.status(400).json({
      message: "To miejsce nie jest wolne",
    });
  }

  if (miejsce.typ === "DLA_PROWADZACEGO" && user.rola === "STUDENT") {
    return res.status(403).json({
      message: "Student nie może rezerwować miejsca dla prowadzących",
    });
  }

  await prisma.reservation.create({
    data: {
      userId: Number(userId),
      parkingSpotId: Number(parkingSpotId),
      dataOd: new Date(dataOd),
      dataDo: new Date(dataDo),
    },
  });

  await prisma.parkingSpot.update({
    where: {
      id: Number(parkingSpotId),
    },
    data: {
      status: "ZAREZERWOWANY",
    },
  });

  res.json({
    message: "Rezerwacja została utworzona",
  });
});

// LISTA REZERWACJI
app.get("/api/reservations", async (req, res) => {
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
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Serwer działa na porcie ${PORT}`);
});