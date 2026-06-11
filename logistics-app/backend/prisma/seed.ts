import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });
async function main() {
  const regions = [
    { code: "NORTH", name: "North India" },
    { code: "SOUTH", name: "South India" },
    { code: "EAST", name: "East India" },
    { code: "WEST", name: "West India" },
    { code: "NORTHEAST", name: "Northeast India" },
    { code: "CENTRAL", name: "Central India" },
  ];

  for (const region of regions) {
    await prisma.region.upsert({
      where: { code: region.code },
      update: {},
      create: region,
    });
  }

  console.log("Database seeded successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
