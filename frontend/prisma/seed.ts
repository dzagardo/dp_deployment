import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function seed() {
  const email = "rachel@remix.run";

  // cleanup the existing database
  await prisma.user.delete({ where: { email } }).catch(() => {
    // no worries if it doesn't exist yet
  });

  const hashedPassword = await bcrypt.hash("racheliscool", 10);

  const user = await prisma.user.create({
    data: {
      email,
      role: 'Data Scientist',  // Replace 'YourRoleHere' with the actual role you want to assign
      password: {
        create: {
          hash: hashedPassword,
        },
      },
    },
  });
  

  // Create sample notes
  await prisma.note.create({
    data: {
      title: "My first note",
      body: "Hello, world!",
      userId: user.id,
    },
  });

  await prisma.note.create({
    data: {
      title: "My second note",
      body: "Hello, world!",
      userId: user.id,
    },
  });

  await prisma.dataset.create({
    data: {
      fileName: "Sample Dataset 1",
      filePath: "/path/to/dataset1.csv",
      fileType: "csv",
      privacyBudget: 1.0,
      userDatasets: {
        create: { userId: user.id },
      },
    },
  });
  
  // Repeat as necessary for additional sample datasets.  

  console.log(`Database has been seeded. 🌱`);
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
