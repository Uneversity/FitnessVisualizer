import { prisma } from "../../../library/prisma";
import { auth } from "@clerk/nextjs/server";

export async function POST(request) {

    const { userId } = await auth();
    
    if (!userId) {
        return Response.json("Unauthorized", {status: 401});
    }
    else if (userId) {

        const body = await request.json();
        const workout = await prisma.workout.create({
            data: {
                exercise: body.exercise,
                reps: body.reps,
                userId
            },

        });

        return Response.json(workout);
    }
}

export async function GET() {

    const { userId } = await auth();
    
    if (!userId) {
        return Response.json("Unauthorized", {status: 401});
    }
    else if (userId) {

        const workouts = await prisma.workout.findMany({
        orderBy: {createdAt: "asc"},
        where: {userId}
        });

        return Response.json(workouts);
    }

}