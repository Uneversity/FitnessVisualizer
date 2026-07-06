"use client"
import { useState, useEffect } from "react"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";


export default function DashboardPage(){

const [workouts, setWorkouts] = useState([]);

useEffect(() =>{

    async function fetchWorkouts() {
        const response = await fetch("/api/workouts");
        const data = await response.json();
        setWorkouts(data);
    }

    fetchWorkouts();


    }, []);

    return (

        <main className="flex flex-col items-center justify-center min-h-screen bg-black">

            <h1 className="text-3xl font-bold text-green-400 mb-4">
                Dashboard
            </h1>
            <p className="text-gray-400">
                Stuff and stuff dashboard stuff.
            </p>

            <div style={{ width: "100%", height: 300}}>
                <ResponsiveContainer>
                    <BarChart data={workouts}>
                        <CartesianGrid strokeDasharray= "3 3" />
                        <XAxis dataKey="exercise"/>
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="reps" fill=""lime/>
                    </BarChart>
                </ResponsiveContainer>
            </div>

        </main>

    )

}