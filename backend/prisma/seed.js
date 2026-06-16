const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function main() {
  await prisma.reservation.deleteMany();
  await prisma.parkingSpot.deleteMany();
  await prisma.user.deleteMany();

  const adminPassword = await bcrypt.hash("admin123", 10);
  const studentPassword = await bcrypt.hash("student123", 10);
  const teacherPassword = await bcrypt.hash("teacher123", 10);

  await prisma.user.create({
    data: {
      imie: "Administrator",
      email: "admin@wspa.pl",
      haslo: adminPassword,
      rola: "ADMIN",
    },
  });

  await prisma.user.create({
    data: {
      imie: "Student",
      email: "student@wspa.pl",
      haslo: studentPassword,
      rola: "STUDENT",
    },
  });

  await prisma.user.create({
    data: {
      imie: "Prowadzący",
      email: "teacher@wspa.pl",
      haslo: teacherPassword,
      rola: "PROWADZACY",
    },
  });

  const miejsca = [];

  for (let i = 1; i <= 5; i++) {
    miejsca.push({
      numer: `P-${i}`,
      poziom: 0,
      typ: "DLA_PROWADZACEGO",
      status: "WOLNY",
    });
  }

  for (let i = 1; i <= 15; i++) {
    miejsca.push({
      numer: `A-${i}`,
      poziom: 0,
      typ: "STANDARD",
      status: "WOLNY",
    });
  }

  await prisma.parkingSpot.createMany({
    data: miejsca,
  });

  console.log("Seed zakończony: dodano użytkowników i 20 miejsc parkingowych WSPA.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
