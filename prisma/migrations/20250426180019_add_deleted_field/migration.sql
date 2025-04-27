-- DropIndex
DROP INDEX "BlockedDate_startDate_endDate_idx";

-- DropIndex
DROP INDEX "Reservation_startDate_endDate_idx";

-- CreateTable
CREATE TABLE "BookingRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isHighSeason" BOOLEAN NOT NULL DEFAULT false,
    "highSeasonStartMonth" INTEGER,
    "highSeasonEndMonth" INTEGER,
    "minimumStayDays" INTEGER NOT NULL DEFAULT 1,
    "enforceGapBetweenBookings" BOOLEAN NOT NULL DEFAULT false,
    "minimumGapDays" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ApartmentInfo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL DEFAULT 'À propos de notre appartement',
    "description" TEXT NOT NULL DEFAULT 'Notre bel appartement est situé dans un emplacement privilégié, offrant confort et commodité pour votre séjour. Que vous visitiez pour affaires ou pour le plaisir, notre appartement offre toutes les commodités dont vous avez besoin.',
    "rules" TEXT NOT NULL DEFAULT 'Veuillez noter les règles de réservation suivantes :
- Entre juillet et septembre, la durée minimum de séjour est de 7 jours
- Il ne peut pas y avoir de jours vides entre deux réservations
- Certaines dates peuvent être bloquées pour maintenance ou autres raisons',
    "amenities" TEXT NOT NULL DEFAULT 'Cuisine entièrement équipée
WiFi haut débit
Climatisation
Machine à laver
TV avec services de streaming
Lits confortables
Draps et serviettes propres
Assistance 24h/24 et 7j/7',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "email", "id", "name", "password", "updatedAt") SELECT "createdAt", "email", "id", "name", "password", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
