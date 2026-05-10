// Front camera stream
let stream = null;

// Interval timer
let captureInterval = null;

// Capture counter
let captureCount = 0;

// Maximum number of captures
const MAX_CAPTURES = 5;

// Interval between captures (15 seconds)
const CAPTURE_INTERVAL = 15000;

// Latest location data
let currentLocation = {
    latitude: null,
    longitude: null,
    accuracy: null
};

// Start front camera
async function startCamera() {
    stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" } // Front camera
    });

    document.getElementById("cam").srcObject = stream;
    await document.getElementById("cam").play();
}

// Get current location
function getLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            return reject(new Error("Geolocation not supported"));
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                currentLocation = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy
                };
                resolve(currentLocation);
            },
            reject,
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0
            }
        );
    });
}

// Capture image and upload with location
async function captureAndUpload() {
    const video = document.getElementById("cam");
    const canvas = document.getElementById("snap");

    if (!video.videoWidth || !video.videoHeight) {
        console.log("Camera not ready");
        return;
    }

    // Set canvas size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame
    const ctx = canvas.getContext("2d");
    
    // Optional: mirror the image so it matches front camera orientation
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    ctx.restore();

    // Convert to Base64 image
    const imageData = canvas.toDataURL("image/png");

    // Upload image + location
    try {
        const response = await fetch("/upload", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                image: imageData,
                location: currentLocation,
                captureNumber: captureCount + 1,
                timestamp: new Date().toISOString()
            })
        });

        const result = await response.json();
        console.log(`Capture ${captureCount + 1} uploaded`, result);
    } catch (e) {
        console.error("Upload failed", e);
    }

    // Increase capture count
    captureCount++;

    // Stop after 5 captures
    if (captureCount >= MAX_CAPTURES) {
        stopCapture();
        console.log("Capture completed. 5 images saved.");
    }
}

// Start capture sequence
function startCapture() {
    captureCount = 0;

    // Capture first image immediately
    captureAndUpload();

    // Capture every 15 seconds
    captureInterval = setInterval(() => {
        captureAndUpload();
    }, CAPTURE_INTERVAL);
}

// Stop interval and camera
function stopCapture() {
    if (captureInterval) {
        clearInterval(captureInterval);
        captureInterval = null;
    }

    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
}

// Initialize and begin
(async () => {
    try {
        await getLocation();   // Request location permission
        await startCamera();   // Request camera permission
        
        // Give the camera half a second to fully initialize before snapping the first pic
        setTimeout(() => {
            startCapture();    // Start 5 captures at 15-second intervals
        }, 500);
        
    } catch (error) {
        console.error("Error:", error);
    }
})();
