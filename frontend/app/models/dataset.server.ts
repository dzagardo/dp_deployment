// database.server.ts
import type { Dataset, User } from "@prisma/client";
import { prisma } from '../db.server';

// Function to retrieve a specific dataset by ID
export function getDataset({ datasetId }: { datasetId: Dataset["id"] }) {
  return prisma.dataset.findUnique({
    where: { id: datasetId },
  });
}

// Function to update the privacy budget for a specific dataset
export function updatePrivacyBudget({ datasetId, newBudget }: { datasetId: Dataset["id"], newBudget: number }) {
  return prisma.dataset.update({
    where: { id: datasetId },
    data: { privacy_budget: newBudget },
  });
}

// Function to list all datasets for a specific user
export function listDatasetsForUser({ userId }: { userId: User["id"] }) {
  return prisma.dataset.findMany({
    where: { userId: userId },
  });
}

// Function to delete a specific dataset by ID
export function deleteDataset({ datasetId }: { datasetId: Dataset["id"] }) {
  return prisma.dataset.delete({
    where: { id: datasetId },
  });
}

// Function to create a new dataset
export function createDataset({ name, filePath, privacyBudget, userId }: { name: string, filePath: string, privacyBudget: number, userId: User["id"] }) {
  return prisma.dataset.create({
    data: {
      name,
      filePath,
      privacy_budget: privacyBudget,
      user: {
        connect: {
          id: userId,
        },
      },
    },
  });
}
