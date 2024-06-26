const video = document.getElementById('video');
const canvas = document.getElementById('overlay');
const context = canvas.getContext('2d');
const startButton = document.getElementById('startButton');
const cameraToggle = document.getElementById('cameraToggle');
const errorMessage = document.getElementById('error-message');
const emotionOutput = document.getElementById('emotion-output');

let currentStream;
let videoOn = false;

function logMessage(message) {
    errorMessage.textContent = message;
    console.log(message);
}

async function startCamera() {
    try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('Browser does not support media devices API.');
        }
        
        const permissions = await navigator.permissions.query({ name: 'camera' });
        logMessage(`Camera permission state is ${permissions.state}`);

        const constraints = {
            video: {
                facingMode: cameraToggle.checked ? 'environment' : 'user'
            }
        };
        currentStream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = currentStream;
        logMessage('Camera started successfully.');
        videoOn = true;
        startButton.textContent = 'Turn Video Off';
    } catch (error) {
        logMessage('Error accessing camera: ' + error.message);
    }
}

function stopCamera() {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        logMessage('Stopped video stream.');
    }
    video.srcObject = null;
    videoOn = false;
    startButton.textContent = 'Turn Video On';
}

startButton.addEventListener('click', () => {
    if (videoOn) {
        stopCamera();
    } else {
        startCamera();
    }
});

// Ensure permissions prompt
navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
        stream.getTracks().forEach(track => track.stop());
        logMessage('Camera permissions granted.');
    })
    .catch(err => {
        logMessage('Cannot access cameras because: ' + err.message);
    });

// Check if the browser supports necessary APIs
if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    logMessage('Browser does not support media devices API.');
}

// Check camera permissions dynamically
navigator.permissions.query({ name: 'camera' }).then(function (permissionStatus) {
    logMessage('Camera permission state is ' + permissionStatus.state);
    permissionStatus.onchange = function () {
        logMessage('Camera permission state has changed to ' + this.state);
    };
}).catch(function (err) {
    logMessage('Cannot query camera permissions because: ' + err.message);
});

video.addEventListener('play', () => {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const displaySize = { width: video.videoWidth, height: video.videoHeight };
    faceapi.matchDimensions(canvas, displaySize);

    setInterval(async () => {
        if (videoOn) {
            const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks()
                .withFaceExpressions();
            const resizedDetections = faceapi.resizeResults(detections, displaySize);
            context.clearRect(0, 0, canvas.width, canvas.height);
            faceapi.draw.drawDetections(canvas, resizedDetections);
            faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
            faceapi.draw.drawFaceExpressions(canvas, resizedDetections);

            // Clear previous emotions
            emotionOutput.innerHTML = '';
            if (detections.length > 0) {
                const emotions = detections[0].expressions;
                for (const [emotion, value] of Object.entries(emotions)) {
                    const li = document.createElement('li');
                    li.textContent = `${emotion}: ${(value * 100).toFixed(2)}%`;
                    emotionOutput.appendChild(li);
                }
            }
        }
    }, 100);
});

Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
    faceapi.nets.faceExpressionNet.loadFromUri('/models')
]).then(() => {
    logMessage('Models loaded successfully.');
}).catch(err => {
    logMessage('Failed to load models because: ' + err.message);
});
