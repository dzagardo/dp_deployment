"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDataset = exports.deleteDataset = exports.listDatasetsForUser = exports.updatePrivacyBudget = exports.getDataset = void 0;
var db_server_1 = require("../db.server");
// Function to retrieve a specific dataset by ID
function getDataset(_a) {
    var datasetId = _a.datasetId;
    return db_server_1.prisma.dataset.findUnique({
        where: { id: datasetId },
    });
}
exports.getDataset = getDataset;
// Function to update the privacy budget for a specific dataset
function updatePrivacyBudget(_a) {
    var datasetId = _a.datasetId, newBudget = _a.newBudget;
    return db_server_1.prisma.dataset.update({
        where: { id: datasetId },
        data: { privacy_budget: newBudget },
    });
}
exports.updatePrivacyBudget = updatePrivacyBudget;
// Function to list all datasets for a specific user
function listDatasetsForUser(_a) {
    var userId = _a.userId;
    return db_server_1.prisma.dataset.findMany({
        where: { userId: userId },
    });
}
exports.listDatasetsForUser = listDatasetsForUser;
// Function to delete a specific dataset by ID
function deleteDataset(_a) {
    var datasetId = _a.datasetId;
    return db_server_1.prisma.dataset.delete({
        where: { id: datasetId },
    });
}
exports.deleteDataset = deleteDataset;
// Function to create a new dataset
function createDataset(_a) {
    var name = _a.name, filePath = _a.filePath, privacyBudget = _a.privacyBudget, userId = _a.userId;
    return db_server_1.prisma.dataset.create({
        data: {
            name: name,
            filePath: filePath,
            privacy_budget: privacyBudget,
            user: {
                connect: {
                    id: userId,
                },
            },
        },
    });
}
exports.createDataset = createDataset;
