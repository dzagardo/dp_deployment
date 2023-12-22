// prismaOperations.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const datasetServer = require('../app/models/dataset.server.js');  // Adjust the path to your dataset.server.ts file

async function listDatasetsForUser(userId) {
    try {
        const datasets = await datasetServer.listDatasetsForUser({ userId: userId });
        console.log(JSON.stringify(datasets));
    } catch (error) {
        console.error('Error: ', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

const action = process.argv[2];
const userId = process.argv[3];

async function createDatasetForUser(datasetDetails) {
    try {
        const { name, filePath, privacyBudget, userId } = datasetDetails;
        const dataset = await datasetServer.createDataset({
            name,
            filePath,
            privacyBudget,
            userId
        });
        console.log(JSON.stringify(dataset));
    } catch (error) {
        console.error('Error: ', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Add a condition to call createDatasetForUser when the script is called with the appropriate action
if (action === 'createDatasetForUser') {
    const details = JSON.parse(process.argv[3]);
    createDatasetForUser(details);
}

if (action === 'listDatasetsForUser') {
    listDatasetsForUser(userId);
}