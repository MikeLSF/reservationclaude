import { PrismaClient } from "@prisma/client";
import { hash } from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminPassword = await hash("admin123", 10);
  
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "Admin",
      password: adminPassword,
    },
  });

  console.log({ admin });

  // Add some blocked dates (example)
  const summerBlock = await prisma.blockedDate.upsert({
    where: { id: "summer-maintenance" },
    update: {},
    create: {
      id: "summer-maintenance",
      startDate: new Date("2025-06-15"),
      endDate: new Date("2025-06-20"),
      reason: "Summer maintenance",
    },
  });

  console.log({ summerBlock });

  // Create default booking rules
  // @ts-expect-error - BookingRule model might not exist yet
  const highSeasonRule = await prisma.bookingRule.upsert({
    where: { id: "high-season-rule" },
    update: {
      name: "Règle Haute Saison",
      isActive: true,
      isHighSeason: true,
      highSeasonStartMonth: 7, // July
      highSeasonEndMonth: 9, // September
      minimumStayDays: 7,
      enforceGapBetweenBookings: true,
      minimumGapDays: 7,
    },
    create: {
      id: "high-season-rule",
      name: "Règle Haute Saison",
      isActive: true,
      isHighSeason: true,
      highSeasonStartMonth: 7, // July
      highSeasonEndMonth: 9, // September
      minimumStayDays: 7,
      enforceGapBetweenBookings: true,
      minimumGapDays: 7,
    },
  });

  // @ts-expect-error - BookingRule model might not exist yet
  const lowSeasonRule = await prisma.bookingRule.upsert({
    where: { id: "low-season-rule" },
    update: {
      name: "Règle Basse Saison",
      isActive: true,
      isHighSeason: false,
      minimumStayDays: 1,
      enforceGapBetweenBookings: false,
    },
    create: {
      id: "low-season-rule",
      name: "Règle Basse Saison",
      isActive: true,
      isHighSeason: false,
      minimumStayDays: 1,
      enforceGapBetweenBookings: false,
    },
  });

  console.log({ highSeasonRule, lowSeasonRule });

  // Create default apartment info
  // @ts-expect-error - ApartmentInfo model might not exist yet
  const apartmentInfo = await prisma.apartmentInfo.upsert({
    where: { id: "default-apartment-info" },
    update: {
      title: "À propos de notre appartement",
      description: "Notre bel appartement est situé dans un emplacement privilégié, offrant confort et commodité pour votre séjour. Que vous visitiez pour affaires ou pour le plaisir, notre appartement offre toutes les commodités dont vous avez besoin.",
      rules: "- Entre juillet et septembre, la durée minimum de séjour est de 7 jours\n- Il ne peut pas y avoir de jours vides entre deux réservations\n- Certaines dates peuvent être bloquées pour maintenance ou autres raisons",
      amenities: "Cuisine entièrement équipée\nWiFi haut débit\nClimatisation\nMachine à laver\nTV avec services de streaming\nLits confortables\nDraps et serviettes propres\nAssistance 24h/24 et 7j/7",
    },
    create: {
      id: "default-apartment-info",
      title: "À propos de notre appartement",
      description: "Notre bel appartement est situé dans un emplacement privilégié, offrant confort et commodité pour votre séjour. Que vous visitiez pour affaires ou pour le plaisir, notre appartement offre toutes les commodités dont vous avez besoin.",
      rules: "- Entre juillet et septembre, la durée minimum de séjour est de 7 jours\n- Il ne peut pas y avoir de jours vides entre deux réservations\n- Certaines dates peuvent être bloquées pour maintenance ou autres raisons",
      amenities: "Cuisine entièrement équipée\nWiFi haut débit\nClimatisation\nMachine à laver\nTV avec services de streaming\nLits confortables\nDraps et serviettes propres\nAssistance 24h/24 et 7j/7",
    },
  });

  console.log({ apartmentInfo });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
