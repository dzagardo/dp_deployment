import type { User, Checklist } from "@prisma/client";

import { prisma } from "~/db.server";

export function getChecklist({
  id,
  userId,
}: Pick<Checklist, "id"> & {
  userId: User["id"];
}) {
  return prisma.checklist.findFirst({
    select: { id: true, items: true, title: true },
    where: { id, userId },
  });
}

export function getChecklistListItems({ userId }: { userId: User["id"] }) {
  return prisma.checklist.findMany({
    where: { userId },
    select: { id: true, title: true },
    orderBy: { updatedAt: "desc" },
  });
}

export function createChecklist({
  items,
  title,
  description,
  userId,
}: {
  items: string;
  title: string;
  description?: string; // Make it optional if it can be null
  userId: User["id"];
}) {
  return prisma.checklist.create({
    data: {
      title,
      description,
      items,
      user: {
        connect: {
          id: userId,
        },
      },
    },
  });
}



export function deleteChecklist({
  id,
  userId,
}: Pick<Checklist, "id"> & { userId: User["id"] }) {
  return prisma.checklist.deleteMany({
    where: { id, userId },
  });
}
