const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  await prisma.user.upsert({
    where: { email: "admin@parking.pl" },
    update: {},
    create: {
      name: "Administrator",
      email: "admin@parking.pl",
      password: "admin123",
      role: "ADMIN",
    },
  });

  for (let i = 1; i <= 20; i++) {
    await prisma.parkingSpot.upsert({
      where: { number: `A-${i}` },
      update: {},
      create: {
        number: `A-${i}`,
        level: 0,
        type: i <= 3 ? "DISABLED" : "STANDARD",
        status: "FREE",
      },
    });
  }

  console.log("Seed zakonczony: dodano admina i miejsca parkingowe.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
