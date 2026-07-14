"use client"
import { useState, useEffect } from "react"
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";


export default function DashboardPage(){

const [workouts, setWorkouts] = useState([]);

function groupByDay(workouts) {
    const map = new Map();

    for (const w of workouts) {
        const d = new Date(w.createdAt);
        // Local-date key: "2026-07-12". Sortable as a plain string.
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

        if (!map.has(key)) {
            map.set(key, {
                key,
                label: d.toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                }),
                items: [],
                totalReps: 0,
            });
        }

        const group = map.get(key);
        group.items.push(w);
        group.totalReps += w.reps;
    }

    // Newest day first
    return [...map.values()].sort((a, b) => (a.key < b.key ? 1 : -1));
}

function capitalizer(str){
	//return str.replace(/\b\w/g, (char) => char.toUpperCase());

	return str.replace(/([A-Z])/g, ' $1').replace(/^./, (match) => match.toUpperCase());
}



useEffect(() =>{

    async function fetchWorkouts() {
        const response = await fetch("/api/workouts");
        const data = await response.json();
        setWorkouts(data);
    }

    fetchWorkouts();


    }, []);

	const [dayIndex, setDayIndex] = useState(0);
    const dayGroups = groupByDay(workouts);
	const currentDay = dayGroups[dayIndex]; 

    return (
        <main className="min-h-screen bg-zinc-950 px-4 py-10 text-zinc-200">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">

            <header className="border-b border-zinc-800 pb-6">
                <h1 className="text-3xl font-bold tracking-tight text-green-400">Dashboard</h1>
                <p className="mt-1 text-sm text-zinc-400">
                    Every session you've logged, newest first.
                </p>
            </header>

			<div className="flex items-center justify-between">
                <button
                    className="rounded bg-zinc-800 px-3 py-1 text-sm text-zinc-400 transition-colors hover:bg-zinc-700"
					onClick={() => setDayIndex(Math.min(dayIndex + 1, dayGroups.length - 1))}
					disabled={dayIndex === dayGroups.length - 1}
				>←</button>

				<span>{currentDay?.label}</span>   {/* "Sat, Jul 11" */}

				<button
                    className="rounded bg-zinc-800 px-3 py-1 text-sm text-zinc-400 transition-colors hover:bg-zinc-700"
					onClick={() => setDayIndex(Math.max(dayIndex - 1, 0))}
					disabled={dayIndex === 0}
				>→</button>
			</div>

            {workouts.length === 0 ? (
                <div className="rounded-xl border border-dashed border-zinc-800 p-12 text-center">
                    <p className="text-zinc-400">No workouts yet.</p>
                    <p className="mt-1 text-sm text-zinc-600">
                        Head to the tracker and finish a set — it'll show up here.
                    </p>
                </div>
            ) : (
                <>
                    {/* Chart */}
                    <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
                        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                            Reps per session
                        </h2>
                        <div className="h-72 w-full">
                            <ResponsiveContainer>
                                <LineChart data={workouts} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                                    <XAxis
                                        dataKey="createdAt"
                                        stroke="#52525b"
                                        tick={{ fill: "#a1a1aa", fontSize: 12 }}
                                        tickFormatter={(value) =>
                                            new Date(value).toLocaleDateString("en-US", {
                                                month: "short",
                                                day: "numeric",
                                            })
                                        }
                                    />
                                    <YAxis
                                        stroke="#52525b"
                                        tick={{ fill: "#a1a1aa", fontSize: 12 }}
                                        allowDecimals={false}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "#18181b",
                                            border: "1px solid #3f3f46",
                                            borderRadius: "0.5rem",
                                            color: "#e4e4e7",
                                        }}
                                        labelFormatter={(value) => new Date(value).toLocaleString("en-US")}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="reps"
                                        stroke="#4ade80"
                                        strokeWidth={2}
                                        dot={{ r: 3, fill: "#4ade80" }}
                                        activeDot={{ r: 5 }}
										data= {currentDay?.items ??[]}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </section>

                    {/* Table, grouped by day */}
                    <section className="overflow-hidden rounded-xl border border-zinc-800">
                        <table className="w-full border-collapse text-sm">
                            <thead>
                                <tr className="border-b border-zinc-800 bg-zinc-900 text-left text-xs uppercase tracking-wider text-zinc-500">
                                    <th className="px-4 py-3 font-semibold">Exercise</th>
                                    <th className="px-4 py-3 text-right font-semibold">Reps</th>
                                    <th className="px-4 py-3 text-right font-semibold">Time</th>
                                </tr>
                            </thead>

                            {dayGroups.map((group) => (
                                <tbody key={group.key}>
                                    <tr className="bg-zinc-900/70">
                                        <td
                                            colSpan={2}
                                            className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-green-400"
                                        >
                                            {group.label}
                                        </td>
                                        <td className="px-4 py-2 text-right text-xs tabular-nums text-zinc-400">
                                            {group.totalReps} reps
                                        </td>
                                    </tr>

                                    {group.items.map((workout) => (
                                        <tr
                                            key={workout.id}
                                            className="border-t border-zinc-800/60 transition-colors hover:bg-zinc-900/40"
                                        >
                                            <td className="px-4 py-3 text-zinc-100">{capitalizer(workout.exercise)}</td>
                                            <td className="px-4 py-3 text-right tabular-nums text-zinc-300">
                                                {workout.reps}
                                            </td>
                                            <td className="px-4 py-3 text-right text-zinc-500">
                                                {new Date(workout.createdAt).toLocaleTimeString("en-US", {
                                                    hour: "numeric",
                                                    minute: "2-digit",
                                                })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            ))}
                        </table>
                    </section>
                </>
            )}

        </div>
    </main>

    )

}