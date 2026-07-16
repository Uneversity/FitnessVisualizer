/*
  Warnings:

  - You are about to drop the `CoachUsage` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "CoachUsage";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "coachUsage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0
);

-- CreateIndex
CREATE UNIQUE INDEX "coachUsage_userId_day_key" ON "coachUsage"("userId", "day");
