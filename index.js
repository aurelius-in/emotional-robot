const video = document.getElementById('video');
const canvas = document.getElementById('overlay');
const context = canvas.getContext('2d');
const switchCameraButton = document.getElementById('switchCameraButton');
const startRecordingButton = document.getElementById('startRecordingButton');
const errorMessage = document.getElementById('error-message');
const emotionOutput = document.getElementById('emotion-output');
const emotionLabel = document.getElementById('emotion-label');

let currentStream;
let videoOn = false;
let usingFrontCamera = true;

function logMessage(message) {
    errorMessage.textContent = message;
    console.log(message);
}

async function startCamera() {
    try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('Browser does not support media devices API.');
        }

        const constraints = {
            video: {
                facingMode: usingFrontCamera ? 'user' : 'environment'
            }
        };
        currentStream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = currentStream;
        logMessage('Camera started successfully.');
        videoOn = true;
        startRecordingButton.textContent = '🛑';
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
    startRecordingButton.textContent = '🎦';
}

switchCameraButton.addEventListener('click', () => {
    usingFrontCamera = !usingFrontCamera;
    if (videoOn) {
        stopCamera();
        startCamera();
    }
});

startRecordingButton.addEventListener('click', () => {
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

video.addEventListener('play', async () => {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const displaySize = { width: video.videoWidth, height: video.videoHeight };
    faceapi.matchDimensions(canvas, displaySize);

    setInterval(async () => {
        if (videoOn) {
            try {
                const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions());
                const resizedDetections = faceapi.resizeResults(detections, displaySize);
                context.clearRect(0, 0, canvas.width, canvas.height);
                faceapi.draw.drawDetections(canvas, resizedDetections);

                console.log(detections);
            } catch (error) {
                if (error.message.includes("d is not a function")) {
                    logMessage("Detected 'd is not a function' error. Ignoring and continuing.");
                } else {
                    logMessage(`Error during detection: ${error.message}`);
                }
            }
        }
    }, 100);
});

// Load face-api models
Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-weights_manifest.json'),
    faceapi.nets.faceLandmark68Net.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-weights_manifest.json'),
    faceapi.nets.faceRecognitionNet.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-weights_manifest.json'),
    faceapi.nets.faceExpressionNet.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_expression_model-weights_manifest.json')
]).then(async () => {
    await tf.setBackend('webgl');
    await tf.ready();
    logMessage('Models loaded and backend set to WebGL successfully.');
    logMessage(`TensorFlow.js backend: ${tf.getBackend()}`);
}).catch(err => {
    logMessage(`Failed to load models because: ${err.message}`);
});
