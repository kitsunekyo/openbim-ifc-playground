/*
  Warnings:

  - You are about to drop the column `conversion_status` on the `IFCModel` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_IFCModel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "geometries_progress" INTEGER NOT NULL,
    "properties_progress" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_IFCModel" ("createdAt", "geometries_progress", "id", "name", "properties_progress") SELECT "createdAt", "geometries_progress", "id", "name", "properties_progress" FROM "IFCModel";
DROP TABLE "IFCModel";
ALTER TABLE "new_IFCModel" RENAME TO "IFCModel";
CREATE UNIQUE INDEX "IFCModel_id_key" ON "IFCModel"("id");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
