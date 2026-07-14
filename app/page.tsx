import Link from "next/link";
import GymPattern from "./components/GymPattern";
import RepDemo from "./components/RepDemo";

const STEPS = [
    {
        title: "Pick your lift",
        body: "Squat or bicep curl. Each one watches a different joint — the knee, or the elbow.",
    },
    {
        title: "Move in frame",
        body: "Your camera finds 33 points on your body, 60 times a second. Nothing leaves the browser.",
    },
    {
        title: "Watch it stack up",
        body: "Every finished set is saved automatically and charted on your dashboard.",
    },
];

export default function Home() {
    return (
        <main className="relative min-h-screen overflow-hidden bg-zinc-950 text-zinc-200">
            {/* Background layer: the pattern, then a vignette so the text stays readable over it. */}
            <div className="pointer-events-none absolute inset-0">
                <GymPattern />
                <div
                    className="absolute inset-0"
                    style={{
                        background:
                            "radial-gradient(ellipse 80% 60% at 50% 30%, rgba(9,9,11,0.95) 0%, rgba(9,9,11,0.7) 45%, rgba(9,9,11,0.2) 100%)",
                    }}
                />
            </div>

            {/* Content layer. `relative` lifts it above the absolutely-positioned background. */}
            <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center px-4 py-20 sm:py-28">

                <span className="rounded-full border border-green-400/30 bg-green-400/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-green-400">
                    Powered by your webcam
                </span>

                <h1 className="mt-8 text-center text-5xl font-bold leading-tight tracking-tight text-zinc-50 sm:text-6xl">
                    Your camera counts
                    <br />
                    <span className="text-green-400">the reps for you.</span>
                </h1>

                <p className="mt-6 max-w-xl text-center text-lg leading-relaxed text-zinc-400">
                    Simply open the tracker,
                    pick a lift, and start moving with real feedback.
                </p>

                <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                    <Link
                        href="/tracker"
                        className="rounded-md bg-green-400 px-6 py-3 text-sm font-semibold text-zinc-950 transition-colors hover:bg-green-300"
                    >
                        Start a workout
                    </Link>
                    <Link
                        href="/dashboard"
                        className="rounded-md border border-zinc-700 px-6 py-3 text-sm font-semibold text-zinc-200 transition-colors hover:bg-zinc-800"
                    >
                        See your history
                    </Link>
                </div>

                {/* The interactive bit */}
                <div className="mt-20 w-full max-w-3xl">
                    <RepDemo />
                </div>

                {/* How it works */}
                <div className="mt-24 w-full">
                    <h2 className="mb-8 text-center text-xs font-semibold uppercase tracking-widest text-zinc-500">
                        How it works
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-3">
                        {STEPS.map((step, index) => (
                            <div
                                key={step.title}
                                className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6 backdrop-blur-sm"
                            >
                                <span className="text-xs font-bold text-green-400">
                                    {String(index + 1).padStart(2, "0")}
                                </span>
                                <h3 className="mt-3 text-lg font-bold text-zinc-50">{step.title}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{step.body}</p>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </main>
    );
}
