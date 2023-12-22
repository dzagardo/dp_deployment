import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function testDatasets() {
    // Clean up any existing data
    await prisma.dataset.deleteMany({}).catch(() => {
        // Ignore error if no datasets found
    });

    // Assuming you have a valid userId:
    const userId = 'clphhvcof0000rrrankn3d4vn'; // Replace with an actual user ID from your database

    const newDataset = await prisma.dataset.create({
        data: {
            name: 'Preprocessed Data',
            filePath: './backend/data/preprocessed_10000_entries.csv',
            privacy_budget: 1.0,
            userId: userId, // Link the dataset to a user
        },
    });

    console.log('New Dataset Created:', newDataset);

    // Retrieve the created dataset
    const dataset = await prisma.dataset.findUnique({
        where: {
            id: newDataset.id,
        },
    });

    console.log('Retrieved Dataset:', dataset);

    // Update the privacy budget
    const updatedDataset = await prisma.dataset.update({
        where: {
            id: newDataset.id,
        },
        data: {
            privacy_budget: 0.9, // New privacy budget
        },
    });

    console.log('Updated Dataset:', updatedDataset);
}

testDatasets()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
