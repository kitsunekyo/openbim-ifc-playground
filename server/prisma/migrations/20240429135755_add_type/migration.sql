/*
  Warnings:

  - Added the required column `type` to the `IFCModel` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_IFCModel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_IFCModel" ("createdAt", "createdBy", "id", "name") SELECT "createdAt", "createdBy", "id", "name" FROM "IFCModel";
DROP TABLE "IFCModel";
ALTER TABLE "new_IFCModel" RENAME TO "IFCModel";
CREATE UNIQUE INDEX "IFCModel_id_key" ON "IFCModel"("id");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
