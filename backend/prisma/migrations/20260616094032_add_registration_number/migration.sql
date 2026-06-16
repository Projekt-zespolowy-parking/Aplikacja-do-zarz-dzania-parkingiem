/*
  Warnings:

  - Added the required column `numerRejestracyjny` to the `Reservation` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Reservation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "parkingSpotId" INTEGER NOT NULL,
    "dataOd" DATETIME NOT NULL,
    "dataDo" DATETIME NOT NULL,
    "numerRejestracyjny" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Reservation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Reservation_parkingSpotId_fkey" FOREIGN KEY ("parkingSpotId") REFERENCES "ParkingSpot" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Reservation" ("createdAt", "dataDo", "dataOd", "id", "parkingSpotId", "userId") SELECT "createdAt", "dataDo", "dataOd", "id", "parkingSpotId", "userId" FROM "Reservation";
DROP TABLE "Reservation";
ALTER TABLE "new_Reservation" RENAME TO "Reservation";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
