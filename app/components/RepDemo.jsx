"use client";

import { useRef, useState } from "react";

// The same two thresholds the tracker uses. The gap between them is the dead zone
// that stops jitter from bouncing the state back and forth.
const FLEXED_THRESHOLD = 90;
const EXTENDED_THRESHOLD = 160;

const MIN_ANGLE = 40;
const MAX_ANGLE = 175;

// Where a given angle sits along the slider track, as a percentage. Used to place
// the threshold tick marks so they line up with the slider handle.
function percentOf(angle) {
    return ((angle - MIN_ANGLE) / (MAX_ANGLE - MIN_ANGLE)) * 100;
}

export default function RepDemo() {
    const [angle, setAngle] = useState(170);
    const [reps, setReps] = useState(0);

    // The remembered phase. A ref, not state — exactly as in the tracker, because it's
    // the LATCH the counter reads, not something the screen needs to re-render for.
    const stageRef = useRef("extended");

    function handleAngleChange(event) {
        const next = Number(event.target.value);
        setAngle(next);

        // CASE 1 — arm the counter once you've curled past the flexed threshold.
        if (next < FLEXED_THRESHOLD) {
            stageRef.current = "flexed";
        }

        // CASE 2 — a rep is the TRANSITION back out. Both halves matter: without the
        // stage check, every extended frame would count as a rep.
        if (stageRef.current === "flexed" && next > EXTENDED_THRESHOLD) {
            stageRef.current = "extended";
            setReps((prev) => prev + 1);
        }
    }

    function reset() {
        setReps(0);
        setAngle(170);
        stageRef.current = "extended";
    }

    // Phase label is DERIVED from the angle — no extra state needed to display it.
    let phase = "Moving";
    if (angle < FLEXED_THRESHOLD) phase = "Flexed";
    else if (angle > EXTENDED_THRESHOLD) phase = "Extended";

    // Arm geometry. The shoulder sits directly above the elbow, so the elbow angle is
    // measured off straight-down: 180° = fully extended, 40° = curled tight.
    const shoulder = { x: 70, y: 30 };
    const elbow = { x: 70, y: 105 };
    const forearm = 72;
    const radians = (angle * Math.PI) / 180;
    const wrist = {
        x: elbow.x + forearm * Math.sin(radians),
        y: elbow.y - forearm * Math.cos(radians),
    };

    return (
        <section className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 backdrop-blur-sm sm:p-8">
            <div className="mb-6 text-center">
                <h2 className="text-xl font-bold text-zinc-50">Try the counter</h2>
                <p className="mt-1 text-sm text-zinc-400">
                    Drag the slider to bend the elbow. This is the exact logic your webcam runs.
                </p>
            </div>

            <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-center sm:justify-center">
                {/* The arm */}
                <svg viewBox="0 0 200 200" className="h-52 w-52 shrink-0">
                    <line
                        x1={shoulder.x}
                        y1={shoulder.y}
                        x2={elbow.x}
                        y2={elbow.y}
                        stroke="#52525b"
                        strokeWidth="8"
                        strokeLinecap="round"
                    />
                    <line
                        x1={elbow.x}
                        y1={elbow.y}
                        x2={wrist.x}
                        y2={wrist.y}
                        stroke="#4ade80"
                        strokeWidth="8"
                        strokeLinecap="round"
                    />
                    <circle cx={shoulder.x} cy={shoulder.y} r="7" fill="#71717a" />
                    <circle cx={elbow.x} cy={elbow.y} r="9" fill="#4ade80" />
                    <circle cx={wrist.x} cy={wrist.y} r="7" fill="#4ade80" />

                    {/* The weight in the hand */}
                    <g transform={`translate(${wrist.x}, ${wrist.y})`}>
                        <rect x="-13" y="-4" width="26" height="8" rx="2" fill="#e4e4e7" />
                        <rect x="-19" y="-9" width="6" height="18" rx="2" fill="#e4e4e7" />
                        <rect x="13" y="-9" width="6" height="18" rx="2" fill="#e4e4e7" />
                    </g>

                    <text
                        x={elbow.x + 20}
                        y={elbow.y + 4}
                        fill="#a1a1aa"
                        fontSize="14"
                        fontWeight="600"
                    >
                        {angle}°
                    </text>
                </svg>

                {/* The readout */}
                <div className="w-full max-w-xs">
                    <div className="mb-6 flex items-end justify-between">
                        <div>
                            <p className="text-[10px] uppercase tracking-wider text-zinc-500">Reps</p>
                            <p className="text-6xl font-normal leading-none tabular-nums text-green-400">
                                {reps}
                            </p>
                        </div>
                        <span className="rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1 text-xs font-semibold text-zinc-300">
                            {phase}
                        </span>
                    </div>

                    {/* Slider, with the two thresholds marked on the track */}
                    <div className="relative">
                        <input
                            type="range"
                            min={MIN_ANGLE}
                            max={MAX_ANGLE}
                            value={angle}
                            onChange={handleAngleChange}
                            aria-label="Elbow angle"
                            className="w-full cursor-pointer accent-green-400"
                        />
                        <div className="pointer-events-none absolute inset-x-0 top-full mt-1 h-3">
                            <span
                                className="absolute h-2 w-px bg-zinc-600"
                                style={{ left: `${percentOf(FLEXED_THRESHOLD)}%` }}
                            />
                            <span
                                className="absolute h-2 w-px bg-zinc-600"
                                style={{ left: `${percentOf(EXTENDED_THRESHOLD)}%` }}
                            />
                        </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between text-xs text-zinc-500">
                        <span>Curl past 90°</span>
                        <span>Extend past 160°</span>
                    </div>

                    <button
                        onClick={reset}
                        className="mt-5 rounded-md border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
                    >
                        Reset
                    </button>
                </div>
            </div>

            <p className="mt-8 border-t border-zinc-800 pt-5 text-center text-xs leading-relaxed text-zinc-500">
                One rep is counted on the way back out, not while you're down there — which is why
                holding the arm curled doesn't run the number up.
            </p>
        </section>
    );
}
