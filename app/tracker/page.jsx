"use client";

import { useEffect, useRef } from "react";
import { PoseLandmarker,  FilesetResolver } from "@mediapipe/tasks-vision";

export default function TrackerPage(){
    const mainRef = useRef(null);
    const poseLandmarkerRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const rafRef = useRef(null);
    const videoRef = useRef(null);
    const stageRef = useRef("up");
    const countRef = useRef(0);

    

    useEffect(() => {


        // This function initializes the PoseLandmarker and starts the webcam stream.
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

            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            videoRef.current.srcObject = stream;


            videoRef.current.onloadeddata = () => {
                detectLoop();
            };

            //These three lines are added to store the stream and the frame ID, so we can clean them up later if needed.
            streamRef.current = stream;
            videoRef.current.srcObject = stream;
            
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

            const hip = landmarks[12];
            const knee = landmarks[14];
            const ankle = landmarks[16];

            const angle = getAngle(hip, knee, ankle);

            countRep(angle);

            ctx.fillStyle = "white";
            ctx.font = "48px sans-serif";
            ctx.fillText(countRef.current.toString(), 30, 60);
            }

            rafRef.current = requestAnimationFrame(detectLoop);

        }

        initializePoseLandmarker();


        const mainElement = mainRef.current;
        if (mainElement) {
            mainElement.focus();
        }

        return () => {
                cancelAnimationFrame(rafRef.current);

                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop());
                }
        };

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
            }
        }


    }, []);

    return (
        <main ref={mainRef} className="flex flex-col items-center justify-center min-h-screen bg-black">
            <div>
                <h1 className="font-bold text-3xl text-green-400 mb-4">
                    Tracker Page
                </h1>
                <p>This is the tracker page content.</p>
            </div>

            {/* The container for the video*/}
            <div className="relative w-full max-w-6xl mt-8">
                {/* The video element displays webcam feed, and canvas overlays pose landmarks */}
                <video ref={videoRef} autoPlay playsInline className="w-full"/>
                <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />
            </div>

        </main>
    )
}

