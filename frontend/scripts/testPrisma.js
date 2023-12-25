// Test script (testPrisma.js)
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const datasets = await prisma.dataset.findMany();
  console.log("Datasets:", datasets);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
