-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Dataset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileType" TEXT NOT NULL DEFAULT 'csv',
    "privacyBudget" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Dataset" ("createdAt", "fileName", "filePath", "fileType", "id", "privacyBudget", "updatedAt") SELECT "createdAt", "fileName", "filePath", "fileType", "id", "privacyBudget", "updatedAt" FROM "Dataset";
DROP TABLE "Dataset";
ALTER TABLE "new_Dataset" RENAME TO "Dataset";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
