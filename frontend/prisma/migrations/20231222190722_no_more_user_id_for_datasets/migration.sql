/*
  Warnings:

  - You are about to drop the column `userId` on the `Dataset` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Dataset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "privacy_budget" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Dataset" ("createdAt", "filePath", "id", "name", "privacy_budget", "updatedAt") SELECT "createdAt", "filePath", "id", "name", "privacy_budget", "updatedAt" FROM "Dataset";
DROP TABLE "Dataset";
ALTER TABLE "new_Dataset" RENAME TO "Dataset";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
