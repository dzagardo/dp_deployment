// prismaOperations.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const datasetServer = require('../app/models/dataset.server.js');  // Adjust the path to your dataset.server.ts file

async function listDatasets() {
    try {
        const datasets = await prisma.dataset.findMany();
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

async function updatePrivacyBudgetForDataset(datasetId, newBudget) {
    try {
        const dataset = await prisma.dataset.update({
            where: { id: datasetId },
            data: { privacy_budget: newBudget },
        });
        console.log(JSON.stringify(dataset));
    } catch (error) {
        console.error('Error: ', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Use this function in your script handling
if (action === 'updatePrivacyBudgetForDataset') {
    const datasetId = process.argv[3];
    const newBudget = parseFloat(process.argv[4]);
    updatePrivacyBudgetForDataset(datasetId, newBudget);
}

// Add a condition to call createDatasetForUser when the script is called with the appropriate action
if (action === 'createDatasetForUser') {
    const details = JSON.parse(process.argv[3]);
    createDatasetForUser(details);
}

if (action === 'listDatasets') {
    listDatasets();
}
