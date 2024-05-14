/*
  Warnings:

  - You are about to drop the column `conversion_progress` on the `IFCModel` table. All the data in the column will be lost.
  - Added the required column `geometries_progress` to the `IFCModel` table without a default value. This is not possible if the table is not empty.
  - Added the required column `properties_progress` to the `IFCModel` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_IFCModel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "conversion_status" TEXT NOT NULL,
    "geometries_progress" INTEGER NOT NULL,
    "properties_progress" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_IFCModel" ("conversion_status", "createdAt", "id", "name") SELECT "conversion_status", "createdAt", "id", "name" FROM "IFCModel";
DROP TABLE "IFCModel";
ALTER TABLE "new_IFCModel" RENAME TO "IFCModel";
CREATE UNIQUE INDEX "IFCModel_id_key" ON "IFCModel"("id");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
