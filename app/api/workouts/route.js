import { prisma } from "../../../library/prisma";

export async function POST(request) {

    const body = await request.json();

    const workout = await prisma.workout.create({
        data: {
            exercise: body.exercise,
            reps: body.reps,
        },
    });

    return Response.json(workout);
}

export async function GET() {
    const workouts = await prisma.workout.findMany({
        orderBy: {createdAt: "asc"},
    });
    return Response.json(workouts);
}