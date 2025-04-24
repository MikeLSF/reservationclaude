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
