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

const emotionColors = {
    angry: 'red',
    disgusted: 'green',
    surprised: 'orange',
    neutral: 'grey',
    fearful: 'black',
    sad: 'darkblue',
    happy: 'yellow'
};

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
                const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
                    .withFaceLandmarks()
                    .withFaceExpressions();
                const resizedDetections = faceapi.resizeResults(detections, displaySize);
                context.clearRect(0, 0, canvas.width, canvas.height);
                faceapi.draw.drawDetections(canvas, resizedDetections);
                faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
                faceapi.draw.drawFaceExpressions(canvas, resizedDetections);

                // Logging detections
                console.log(detections);

                // Clear previous emotions
                emotionOutput.innerHTML = '';
                emotionLabel.textContent = '';
                document.body.style.backgroundColor = '#f0f0f0';

                if (detections.length > 0) {
                    const emotions = detections[0].expressions;
                    let dominantEmotion = '';
                    let maxValue = 0;
                    for (const [emotion, value] of Object.entries(emotions)) {
                        const li = document.createElement('li');
                        li.textContent = `${emotion}: ${(value * 100).toFixed(2)}%`;
                        emotionOutput.appendChild(li);

                        if (value > maxValue) {
                            dominantEmotion = emotion;
                            maxValue = value;
                        }
                    }
                    if (dominantEmotion) {
                        emotionLabel.textContent = dominantEmotion.charAt(0).toUpperCase() + dominantEmotion.slice(1);
                        document.body.style.backgroundColor = emotionColors[dominantEmotion];
                        logMessage(`Dominant Emotion: ${dominantEmotion}`);
                    }
                }
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
