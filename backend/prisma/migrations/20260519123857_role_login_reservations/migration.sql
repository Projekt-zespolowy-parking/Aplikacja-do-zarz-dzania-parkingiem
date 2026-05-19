/*
  Warnings:

  - You are about to drop the column `createdAt` on the `ParkingSpot` table. All the data in the column will be lost.
  - You are about to drop the column `level` on the `ParkingSpot` table. All the data in the column will be lost.
  - You are about to drop the column `number` on the `ParkingSpot` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `ParkingSpot` table. All the data in the column will be lost.
  - You are about to drop the column `endTime` on the `Reservation` table. All the data in the column will be lost.
  - You are about to drop the column `startTime` on the `Reservation` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Reservation` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `User` table. All the data in the column will be lost.
  - Added the required column `numer` to the `ParkingSpot` table without a default value. This is not possible if the table is not empty.
  - Added the required column `poziom` to the `ParkingSpot` table without a default value. This is not possible if the table is not empty.
  - Added the required column `typ` to the `ParkingSpot` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dataDo` to the `Reservation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dataOd` to the `Reservation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `haslo` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `imie` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ParkingSpot" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "numer" TEXT NOT NULL,
    "poziom" INTEGER NOT NULL,
    "typ" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'WOLNY'
);
INSERT INTO "new_ParkingSpot" ("id", "status") SELECT "id", "status" FROM "ParkingSpot";
DROP TABLE "ParkingSpot";
ALTER TABLE "new_ParkingSpot" RENAME TO "ParkingSpot";
CREATE UNIQUE INDEX "ParkingSpot_numer_key" ON "ParkingSpot"("numer");
CREATE TABLE "new_Reservation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "parkingSpotId" INTEGER NOT NULL,
    "dataOd" DATETIME NOT NULL,
    "dataDo" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Reservation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Reservation_parkingSpotId_fkey" FOREIGN KEY ("parkingSpotId") REFERENCES "ParkingSpot" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Reservation" ("createdAt", "id", "parkingSpotId", "userId") SELECT "createdAt", "id", "parkingSpotId", "userId" FROM "Reservation";
DROP TABLE "Reservation";
ALTER TABLE "new_Reservation" RENAME TO "Reservation";
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "imie" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "haslo" TEXT NOT NULL,
    "rola" TEXT NOT NULL DEFAULT 'STUDENT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_User" ("createdAt", "email", "id") SELECT "createdAt", "email", "id" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
