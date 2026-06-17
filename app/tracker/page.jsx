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

            for (const point of landmarks) {

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

            for (const connection of PoseLandmarker.POSE_CONNECTIONS) {

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

    function countRep(angle) {

        const DOWN_THRESHOLD = 90;
        const UP_THRESHOLD = 160;

        if (angle < DOWN_THRESHOLD) {
            stageRef.current = "down";
        }

        if (stageRef.current === "down" && angle > UP_THRESHOLD) {
            stageRef.current = "up";
            countRef.current = countRef.current + 1;

            setReps(countRef.current);
        }
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

    function stopWebcam() {

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

            <button onClick={launchWebcam}>Launch Webcam</button>
            <button onClick={stopWebcam}>Stop Webcam</button>
        {/*
            <button onClick={}>Start Rep Counting</button>
            <button onClick={}>Stop Rep Counting</button>*/}


            {/* The container for the video*/}
            <div className="relative w-full max-w-6xl mt-8">
                {/* The video element displays webcam feed, and canvas overlays pose landmarks */}
                <video ref={videoRef} autoPlay playsInline className="w-full"/>
                <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />

                <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded">
                    Reps: {reps}
                </div>

            </div>

        </main>
    )
}

