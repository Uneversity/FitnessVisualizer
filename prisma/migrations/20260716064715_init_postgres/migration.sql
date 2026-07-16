-- CreateTable
CREATE TABLE "Workout" (
    "id" SERIAL NOT NULL,
    "exercise" TEXT NOT NULL,
    "reps" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Workout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachUsage" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CoachUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CoachUsage_userId_day_key" ON "CoachUsage"("userId", "day");
