/*
  Warnings:

  - You are about to drop the `Checklist` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `name` on the `Dataset` table. All the data in the column will be lost.
  - You are about to drop the column `privacy_budget` on the `Dataset` table. All the data in the column will be lost.
  - Added the required column `fileName` to the `Dataset` table without a default value. This is not possible if the table is not empty.
*/

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Checklist";
PRAGMA foreign_keys=on;

-- CreateTable for UserDataset
CREATE TABLE "UserDataset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "datasetId" TEXT NOT NULL,
    "role" TEXT,
    CONSTRAINT "UserDataset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UserDataset_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "Dataset" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Redefine Tables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Dataset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fileName" TEXT NOT NULL DEFAULT 'defaultFileName', -- Provide a default value
    "filePath" TEXT NOT NULL DEFAULT 'defaultFilePath', -- Provide a default value
    "fileType" TEXT NOT NULL DEFAULT 'csv',
    "privacyBudget" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Dataset" ("id", "fileName", "filePath", "fileType", "privacyBudget", "createdAt", "updatedAt")
SELECT "id", 'defaultFileName', 'defaultFilePath', "fileType", "privacyBudget", "createdAt", "updatedAt" FROM "Dataset"; -- Use default values for fileName and filePath
DROP TABLE "Dataset";
ALTER TABLE "new_Dataset" RENAME TO "Dataset";

-- Redefine User Table
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "role" TEXT
);
INSERT INTO "new_User" ("id", "email", "createdAt", "updatedAt", "role") SELECT "id", "email", "createdAt", "updatedAt", "role" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- Check Foreign Keys
PRAGMA foreign_key_check;

-- Turn Foreign Keys back ON
PRAGMA foreign_keys=ON;

-- CreateIndex for UserDataset
CREATE UNIQUE INDEX "UserDataset_userId_datasetId_key" ON "UserDataset"("userId", "datasetId");
