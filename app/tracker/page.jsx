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
                modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
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

            ctx.fillStyle = "white";
            ctx.font = "48px sans-serif";
            ctx.fillText(countRef.current.toString(), 30, 60);

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

        ctx.fillStyle = "white";
        ctx.font = "48px sans-serif";
        ctx.fillText(countRef.current.toString(), 30, 60);
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

    function countRep(angle, downThreshold, upThreshold) {

        if (angle < downThreshold) {
            stageRef.current = "down";
        }

        if (stageRef.current === "down" && angle > upThreshold) {
            stageRef.current = "up";
            countRef.current = countRef.current + 1;

            setReps(countRef.current);
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
    }

    //
    async function saveWorkout() {
        await fetch("/api/workouts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                exercise: selectedExerciseRef.current,
                reps: countRef.current,
            }),
        });
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
        <main ref={mainRef} className="flex flex-col items-center justify-center min-h-screen bg-black">
            <div>
                <h1 className="font-bold text-3xl text-green-400 mb-4">
                    Tracker Page
                </h1>
                <p>This is the tracker page content.</p>
            </div>

           {/* <div>
                <span className="font-bold text-3xl text-green-400 mb-4">
                    <button class="inline-block text-white font-bold py-2 px-4 rounded" onClick={launchWebcam}>Bicep Curl</button>
                    <button class="inline-block text-white font-bold py-2 px-4 rounded" onClick={launchWebcam}>Tricep Curl</button>

                </span>
            </div>*/}
            

            <div className="flex gap-2 mt-4">
                {Object.keys(EXERCISES).map((key) => (
                    <button
                        key={key}
                        onClick={() => selectExercise(key)}
                        className={
                            selectedExercise === key
                                ? "bg-green-500 text-black px-4 py-2 rounded"
                                : "bg-gray-700 text-white px-4 py-2 rounded"
                        }
                    >
                        {EXERCISES[key].name}
                    </button>
                ))}
            </div>

            
            <button className="bg-green-500 text-black px-4 py-2 rounded" onClick={launchWebcam}>Launch Webcam</button>
            <button className="bg-green-500 text-black px-4 py-2 rounded bg-red-500/30" onClick={stopWebcam}>Stop Webcam</button>
            {/*<button className="bg-green-500 text-black px-4 py-2 rounded bg-red-500/30" onClick={() => alert("fired")}  >Stop Webcam</button>*/}

            
        {/*
            <button onClick={}>Start Rep Counting</button>
            <button onClick={}>Stop Rep Counting</button>*/}


            {/* The container for the video*/}
            <div className="relative w-full max-w-6xl mt-8">
                {/* The video element displays webcam feed, and canvas overlays pose landmarks */}
                <video ref={videoRef} autoPlay playsInline className="w-full"/>
                <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full pointer-events-none" />

                <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded">
                    Reps: {reps}
                </div>

            </div>

        </main>
    )
}

