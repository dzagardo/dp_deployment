import type { User, Dataset } from "@prisma/client";
import { prisma } from "~/db.server";

export async function getDataset({ id, userId }: { id: string; userId: string }) {
  const userDataset = await prisma.userDataset.findFirst({
    where: { userId, datasetId: id },
    include: { dataset: true, user: true }, // Make sure to include the user here
  });

  if (!userDataset) {
    throw new Error("Dataset not found or you're not authorized to access this dataset");
  }

  return {
    ...userDataset.dataset,
    user: userDataset.user, // Include the user in the response
    totalQueries: userDataset.dataset.totalQueries, // Include the totalQueries field
  };
}


export function getDatasetListItems({ userId }: { userId: string }) {
  return prisma.userDataset.findMany({
    where: { userId },
    include: {
      dataset: true,
      user: true, // Include user information here
    },
    orderBy: { dataset: { updatedAt: "desc" } },
  }).then(results => results.map(res => ({
    ...res.dataset,
    user: res.user, // Spread the dataset and include the user object
    totalQueries: res.dataset.totalQueries, // Include the totalQueries field
  })));
}

export async function createDataset({
  fileName,
  fileType,
  filePath,
  privacyBudget,
  userId
}: {
  fileName: string;
  fileType: string;
  filePath: string;
  privacyBudget: number;
  userId: string;
}) {
  return prisma.dataset.create({
    data: {
      fileName,
      fileType,
      filePath,
      privacyBudget, // Include the privacyBudget here
      totalQueries: 0, // Initialize totalQueries for a new dataset
      userDatasets: {
        create: {
          userId, // Associate the dataset with the user
        },
      },
    },
  });
}

export async function getDatasets() {
  return prisma.dataset.findMany();
}


export async function deleteDataset({ id, userId }: { id: string; userId: string }) {
  const userDataset = await prisma.userDataset.findFirst({
    where: { userId, datasetId: id },
  });

  if (!userDataset) {
    throw new Error("Dataset not found or you're not authorized to modify this dataset");
  }

  await prisma.userDataset.deleteMany({
    where: { datasetId: id },
  });

  return prisma.dataset.delete({
    where: { id },
  });
}

export async function updateDataset({
  id,
  userId,
  data,
  resetQueries = false // This flag allows for resetting the totalQueries count
}: {
  id: string;
  userId: string;
  data: {
    fileName: string;
    privacyBudget: number;
    filePath?: string;
    totalQueries?: number; // Now the function can accept a totalQueries count
  };
  resetQueries?: boolean; // Optional parameter to reset totalQueries
}) {
  // Check if the dataset exists and is associated with the user, including the dataset relationship
  const userDataset = await prisma.userDataset.findFirst({
    where: { userId, datasetId: id },
    include: { dataset: true }, // Include the dataset relation here
  });

  // If no association is found, throw an error
  if (!userDataset || !userDataset.dataset) {
    throw new Error("Dataset not found or you're not authorized to modify this dataset");
  }

  // Calculate the new totalQueries count
  const newTotalQueries = resetQueries ? 0 : (data.totalQueries ?? userDataset.dataset.totalQueries); // Access totalQueries from the included dataset

  // Proceed with updating the dataset
  return prisma.dataset.update({
    where: { id },
    data: {
      fileName: data.fileName, // Update the filename
      privacyBudget: data.privacyBudget, // Update the privacyBudget
      filePath: data.filePath, // Update the filePath if provided
      totalQueries: newTotalQueries, // Set the new totalQueries count
    },
  });
}
