import type { User, Dataset } from "@prisma/client";
import { prisma } from "~/db.server";

export async function getDataset({ id, userId }: { id: string; userId: string }) {
  const userDataset = await prisma.userDataset.findFirst({
    where: { userId, datasetId: id },
    include: { dataset: true },
  });

  if (!userDataset) {
    throw new Error("Dataset not found or you're not authorized to access this dataset");
  }

  return userDataset.dataset;
}


export function getDatasetListItems({ userId }: { userId: string }) {
  return prisma.userDataset.findMany({
    where: { userId },
    select: { dataset: true },
    orderBy: { dataset: { updatedAt: "desc" } },
  }).then(results => results.map(res => res.dataset));
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
}: {
  id: string;
  userId: string;
  data: {
    fileName: string;
    privacyBudget: number;
    filePath?: string;  // Making filePath optional
  };
}) {
  // Check if the dataset exists and is associated with the user
  const userDataset = await prisma.userDataset.findFirst({
    where: { userId, datasetId: id },
  });

  // If no association is found, throw an error
  if (!userDataset) {
    throw new Error("Dataset not found or you're not authorized to modify this dataset");
  }

  // Proceed with updating the dataset
  return prisma.dataset.update({
    where: { id },
    data: {
      fileName: data.fileName,        // Update the filename
      privacyBudget: data.privacyBudget,  // Update the privacyBudget
    },
  });
}