"use client";

import { useEffect, useRef, useState } from "react";
import { PoseLandmarker,  FilesetResolver } from "@mediapipe/tasks-vision";

//useEffect: for running side effects after page is rendered alongside JSX components
//useRef: for creating mutable references to DOM elements and other values that can change without causing a re-render.
//useState: for managing state in a functional component, allowing the component to re-render when the state changes

export default function TrackerPage(){
    const mainRef = useRef(null);
    const poseLandmarkerRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);

    // rafRef is used to store the ID returned by requestAnimationFrame, so we can cancel it later if needed.
    const rafRef = useRef(null);

    const videoRef = useRef(null);
    const stageRef = useRef("up");
    const countRef = useRef(0);
    const [reps, setReps] = useState(0); 

    const [selectedExercise, setSelectedExercise] = useState("bicepCurl"); // for the UI
    const selectedExerciseRef = useRef("bicepCurl");    

    const EXERCISES = {
        squat: {name: "Squat", points: [24, 26, 28], down: 90, up: 160},
        bicepCurl: {name: "Bicep Curl", points: [12, 14, 16], down: 40, up: 160},
        tricepExtension: {name: "Tricep Extension", points: [12, 14, 16], down: 90, up: 160}
    }

    async function initializePoseLandmarker() {
        const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm");
        poseLandmarkerRef.current = await PoseLandmarker.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task",
                delegate: "GPU"
            },
            runningMode: "VIDEO",
            numPoses: 1,
        }); 
    }

    const lastReportedRef = useRef(0);
    const frameCountRef = useRef(0);   //amount of frames counted so far this second
    function detectLoop() {

        const video = videoRef.current;
        const landmarker = poseLandmarkerRef.current;
        const canvas = canvasRef.current;

        // skip frames that aren't ready, but keep the loop alive
        if (video.readyState < 2) {
            rafRef.current = requestAnimationFrame(detectLoop);
            return;
        }

        const ctx = canvas.getContext("2d");
        
        //This comment below it suppresses the inpurity error caused by perf.now being here
        // eslint-disable-next-line react-hooks/purity
        const results = landmarker.detectForVideo(video, performance.now());

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        if (results.landmarks && results.landmarks.length > 0) {

            const landmarks = results.landmarks[0];

            const exercise = EXERCISES[selectedExerciseRef.current];
            const [aIndex, bIndex, cIndex] = exercise.points;

            const a = landmarks[aIndex];
            const b = landmarks[bIndex];
            const c = landmarks[cIndex];

            const angle = getAngle(a, b, c);

            countRep(angle, exercise.down, exercise.up);

            //ctx.fillStyle = "white";
            //ctx.font = "48px sans-serif";
            //ctx.fillText(countRef.current.toString(), 30, 60);

            // the 3 joints this exercise cares about — everything else is "background"
            const activePoints = new Set([aIndex, bIndex, cIndex]);
            // a connection is "active" only if it links two of the three, and in the
            // right order (a→b and b→c, the two segments that form the tracked angle)
            const isActiveConnection = (start, end) =>
                (start === aIndex && end === bIndex) ||
                (start === bIndex && end === aIndex) ||
                (start === bIndex && end === cIndex) ||
                (start === cIndex && end === bIndex);

            // --- CONNECTIONS FIRST, so the dots sit on top of the lines ---
            for (const connection of PoseLandmarker.POSE_CONNECTIONS .filter((_, index) => index > 9)) {

                const startLandmark = landmarks[connection.start];
                const endLandmark = landmarks[connection.end];

                const x1 = startLandmark.x * canvas.width;
                const y1 = startLandmark.y * canvas.height;
                const x2 = endLandmark.x * canvas.width;
                const y2 = endLandmark.y * canvas.height;

                const active = isActiveConnection(connection.start, connection.end);

                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.globalAlpha = active ? 1 : 0.25;   // dim the rest of the skeleton
                ctx.strokeStyle = active ? "#4ade80" : "white";
                ctx.lineWidth = active ? 5 : 2;
                ctx.stroke();
            }

            // --- THEN THE POINTS ---
            for (const point of landmarks .filter((_, index) => index > 10)) {

                const index = landmarks.indexOf(point);
                const active = activePoints.has(index);

                const px = point.x * canvas.width;
                const py = point.y * canvas.height;
                ctx.beginPath();
                ctx.arc(px, py, active ? 9 : 5, 0, 2 * Math.PI);
                ctx.globalAlpha = active ? 1 : 0.25;   // faint dots for the rest
                ctx.fillStyle = active ? "#4ade80" : "white";
                ctx.fill();

                // only label the joints that matter, and keep them readable
                if (active) {
                    ctx.fillStyle = "yellow";
                    ctx.font = "16px sans-serif";
                    ctx.fillText(index.toString(), px + 10, py);
                }
            }

            ctx.globalAlpha = 1;   // reset so nothing else on the canvas is affected
        }

        frameCountRef.current += 1;

        // eslint-disable-next-line react-hooks/purity
        const now2 = performance.now();

        if (lastReportedRef.current === 0) {
            lastReportedRef.current = now2;                 // first frame: just start the clock
        } 
        else if (now2 - lastReportedRef.current >= 1000) {
            console.log(frameCountRef.current + " fps"); // frames in the last second = fps
            frameCountRef.current = 0;                    // reset the tally
            lastReportedRef.current = now2;                  // start a fresh window
        }

        rafRef.current = requestAnimationFrame(detectLoop);
        
    }

    function getAngle(a, b, c) {
            
        const angleBC = Math.atan2(c.y - b.y, c.x - b.x);
        const angleBA = Math.atan2(a.y - b.y, a.x - b.x);

        let radians = angleBC - angleBA;

        let degrees = Math.abs(radians * 180 / Math.PI);

        if (degrees > 180) {
            degrees = 360 - degrees;
        }

        return degrees;
    }

    

    const repHistoryRef = useRef([]);   // completed reps
    const minAngleRef = useRef(180);  // running min for the CURRENT rep
    const maxAngleRef = useRef(0);    // running max for the CURRENT rep
    const repStartRef = useRef(null);

    function countRep(angle, downThreshold, upThreshold) {

        repStartRef.current = performance.now();

        minAngleRef.current = Math.min(minAngleRef.current, angle);
        maxAngleRef.current = Math.max(maxAngleRef.current, angle);

        if (angle < downThreshold) {
            stageRef.current = "down";
        }

        if (stageRef.current === "down" && angle > upThreshold) {
            stageRef.current = "up";
            countRef.current = countRef.current + 1;
            setReps(countRef.current);

            const now = performance.now();

            repHistoryRef.current.push({
                rep: countRef.current,
                minAngle: Math.round(minAngleRef.current),
                maxAngle: Math.round(maxAngleRef.current),
                repDuration: Math.round(now - repStartRef.current)
                // what else? see the gaps below
            });

            // ??? something important is missing here
            minAngleRef.current = 180;
            maxAngleRef.current = 0;

        }
    }

    function selectExercise(key) {

        setSelectedExercise(key);          // UI: re-render so the right button highlights
        selectedExerciseRef.current = key; // loop: update the value detectLoop reads live

        countRef.current = 0;              // new exercise → reset the rep count
        setReps(0);                        // reflect that reset on screen
        stageRef.current = "up";           // reset the state machine to a clean "up" start
    }

    async function launchWebcam() {

        // Request access to the webcam and set the video element's source to the webcam stream.
        //GetUserMedia simply and only gives permission to access the webcam and starts the video feed
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });

        videoRef.current.srcObject = stream;

        videoRef.current.onloadeddata = () => {
            detectLoop();
        };

        // Store the stream in a ref so we can stop it later when needed.
        streamRef.current = stream;

        resetSession()
        setAbleToSave(true);
        setTryAgain(false);

    }

    async function saveWorkout() {

        if (countRef.current === 0) {
            setFeedback("No reps detected, nothing saved.");
            return;
        }
        else {
            await fetch("/api/workouts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    exercise: selectedExerciseRef.current,
                    reps: countRef.current,
                }),
            });
        }

    }

    async function stopWebcam() {
        cancelAnimationFrame(rafRef.current);

        if (streamRef.current) {
            // Stop all tracks of the webcam stream to turn off the webcam.
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }

        await handleStop()
    }

    async function stopWebcam2() {

        cancelAnimationFrame(rafRef.current);
        
        if (streamRef.current) {

            // Stop all tracks of the webcam stream to turn off the webcam.
            streamRef.current.getTracks().forEach(track => track.stop());
        }

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }

        setIsPending(false);
        setTryAgain(false);
        setAbleToSave(false);
        resetSession()

    }

    function resetSession() {

        countRef.current = 0;
        setReps(0);                        // the ref's UI twin, means the screen updates too
        repHistoryRef.current = [];
        stageRef.current = "up";
        minAngleRef.current = 180;
        maxAngleRef.current = 0;

    }

    const [feedback, setFeedback] = useState("No feedback yet. Start a new session and get to it.");
    const [isPending, setIsPending] = useState(false);
    const [ableToSave, setAbleToSave] = useState(false);
    const [tryAgain, setTryAgain] = useState(false);
    async function getFeedback() {

        try{
            console.log("Getting feedback");
            const res = await fetch("/api/aicoach", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    exercise: selectedExerciseRef.current,
                    repHistory: repHistoryRef.current
                }),
            });

            
            console.log("Feedback received");
            const data = await res.json();
            console.log("Sending notes");
            setFeedback(data.notes);
    
            if (res.ok) {
                console.log("Coach Operational");
                resetSession();
                setTryAgain(false);
                setAbleToSave(false);
            }
            else{
                setTryAgain(true);
                setAbleToSave(true);
            }

        }
        catch(error){
            console.error("Error fetching feedback:", error);
            setFeedback("Error fetching feedback. Please try again later.");
            setTryAgain(true);
        }
        finally{
            setIsPending(false);
        }

    }

    async function handleStop() {
        setIsPending(true);
        await saveWorkout();
        await getFeedback();
        cancelAnimationFrame(rafRef.current);
    }

    async function retryAnalysis() {
        setIsPending(true);
        await getFeedback();   // re-ask the coach ONLY — no save, no camera teardown
    }

    //useEffect allows code to run after the component has rendered.
    useEffect(() => {
        
        //fixed some "A tree hydrated but some attributes of the server rendered HTML didn't match the client properties. This won't be patched up. This can happen if a SSR-ed Client Component used:"
        setAbleToSave(!!navigator.mediaDevices);
        
        initializePoseLandmarker();

        // Set focus to the main element when the component mounts, so it can capture keyboard events if needed.
        const mainElement = mainRef.current;
        if (mainElement) {
            mainElement.focus();
        }

        const currentVideo = videoRef.current;

        // The return function inside useEffect is a cleanup function that runs when the component unmounts.
        return () => {
            
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }

            cancelAnimationFrame(rafRef.current);
            if (currentVideo) {
                currentVideo.srcObject = null;
            }

        };

    }, []);


    return (
    <main ref={mainRef} className="min-h-screen bg-zinc-950 px-4 py-10 text-zinc-200">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">

            {/* Header */}
                <header className="border-b border-zinc-800 pb-6">
                    <h1 className="text-3xl font-bold tracking-tight text-green-400">Tracker</h1>
                    <p className="mt-1 text-sm text-zinc-400">
                        Pick an exercise, start a new session, and reps are counted automatically (Currently only right arm is supported, other limbs in the future).
                    </p>
                    <p className="mt-1 text-sm text-zinc-400">
                        Limited amount of anaysis per day.
                    </p>
                </header>

            {/* Exercise picker — segmented control */}
                <section>
                    <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        Exercise
                    </h2>
                    <div className="inline-flex flex-wrap gap-1 rounded-lg border border-zinc-800 bg-zinc-900 p-1">
                        {Object.keys(EXERCISES).map((key) => (
                            <button
                                key={key}
                                onClick={() => selectExercise(key)}
                                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                                    isPending ? "opacity-50 cursor-not-allowed" : "",
                                    selectedExercise === key
                                        ? "bg-green-400 text-zinc-950"
                                        : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                                    
                                }`}
                                disabled={isPending}
                            >
                                {EXERCISES[key].name}
                            </button>
                        ))}
                    </div>
                </section>

            {/* Camera controls */}
                <section className="flex flex-wrap gap-3">
                    <button
                        onClick={launchWebcam}
                        disabled={isPending}
                        className={`rounded-md bg-green-400 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-green-300
                        ${
                            isPending ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                    >
                        New session
                    </button>
                    <button
                        onClick={tryAgain ? retryAnalysis : stopWebcam}
                        disabled={isPending || !ableToSave}
                        className={`rounded-md border border-green-500/40 bg-green-500/10 px-5 py-2.5 text-sm font-semibold text-green-300 transition-colors hover:bg-green-500/20 
                        ${
                            isPending || !ableToSave ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                    >
                        {isPending ? "Saving and analyzing…" : tryAgain ? "Try Analysis Again" : "Save and analyze"}

                    </button>
                    <button
                        onClick={stopWebcam2}
                        disabled={isPending || !ableToSave}
                        className={`rounded-md border border-red-500/40 bg-red-500/10 px-5 py-2.5 text-sm font-semibold text-red-300 transition-colors hover:bg-red-500/20 
                        ${
                            isPending || !ableToSave ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                    >
                        {"Stop and Reset"}

                    </button>
                </section>

            {/* Video + canvas overlay */}
                <section className="relative min-h-[360px] overflow-hidden rounded-xl border border-zinc-800 bg-black">
                    <video ref={videoRef} autoPlay playsInline muted className="block w-full" />
                    <canvas
                        ref={canvasRef}
                        className="pointer-events-none absolute inset-0 h-full w-full"
                    />

                    <div className="absolute left-4 top-4 rounded-lg bg-black/60 px-4 py-2 backdrop-blur-sm">
                        <p className="text-[10px] uppercase tracking-wider text-zinc-400">Reps</p>
                        <p className="text-4xl font-bold leading-none tabular-nums text-green-400">
                            {reps}
                        </p>
                    </div>
                </section>

            {/* Feedback */}
                <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
                    <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        Feedback
                    </h2>
                    {isPending && <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Analyzing...</p>}
                    {!isPending && feedback && (
                        <p className={feedback ? "text-zinc-100" : "text-zinc-600"}>
                            {feedback}
                        </p>
                    )}
                </section>

        </div>
    </main>
    )
}

