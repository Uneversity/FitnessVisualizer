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

            for (const point of landmarks .filter((_, index) => index > 10)) {

                const px = point.x * canvas.width;
                const py = point.y * canvas.height;
                ctx.beginPath();
                ctx.arc(px, py, 5, 0, 2 * Math.PI);
                ctx.fillStyle = "lime";
                ctx.fill();

                // NEW: label it with its index
                ctx.fillStyle = "yellow";
                ctx.font = "16px sans-serif";
                ctx.fillText(landmarks.indexOf(point).toString(), px + 8, py);
            }

            for (const connection of PoseLandmarker.POSE_CONNECTIONS .filter((_, index) => index > 9)) {

                const startLandmark = landmarks[connection.start];
                const endLandmark = landmarks[connection.end];

                const x1 = startLandmark.x * canvas.width;
                const y1 = startLandmark.y * canvas.height;
                const x2 = endLandmark.x * canvas.width;
                const y2 = endLandmark.y * canvas.height;

                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.strokeStyle = "red";
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        }

        if (results.landmarks && results.landmarks.length > 0) {
        const landmarks = results.landmarks[0];

        const rShoulder = landmarks[12];
        const rElbow = landmarks[14];
        const rWrist = landmarks[16];

        const angle = getAngle(rShoulder, rElbow, rWrist);

        countRep(angle);

        //ctx.fillStyle = "white";
        //ctx.font = "48px sans-serif";
        //ctx.fillText(countRef.current.toString(), 30, 60);
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

        await saveWorkout();
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

    function resetSession() {

        countRef.current = 0;
        setReps(0);                        // the ref's UI twin, means the screen updates too
        repHistoryRef.current = [];
        stageRef.current = "up";
        minAngleRef.current = 180;
        maxAngleRef.current = 0;

    }

    const [feedback, setFeedback] = useState("No feedback yet. Start the camera and get to it.");
    const [isPending, itIsPending] = useState(false);
    async function getFeedback() {

        itIsPending(true);

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

            console.log("data sent");
            setFeedback(data.notes);
        }
        catch(error){
            console.error("Error fetching feedback:", error);
            setFeedback("Error fetching feedback. Please try again later.");
        }
        finally{
            itIsPending(false);
        }

    }

    async function handleStop() {
        await saveWorkout();
        await getFeedback();
        cancelAnimationFrame(rafRef.current);
    }


    //useEffect allows code to run after the component has rendered.
    useEffect(() => {
        
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
                        Pick an exercise, start the camera, and reps are counted automatically.
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
                                    selectedExercise === key
                                        ? "bg-green-400 text-zinc-950"
                                        : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                                }`}
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
                        className="rounded-md bg-green-400 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-green-300"
                    >
                        Start camera
                    </button>
                    <button
                        onClick={stopWebcam}
                        className="rounded-md border border-red-500/40 bg-red-500/10 px-5 py-2.5 text-sm font-semibold text-red-300 transition-colors hover:bg-red-500/20"
                    >
                        Stop and save
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

