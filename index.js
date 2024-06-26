const video = document.getElementById('video');
const canvas = document.getElementById('overlay');
const context = canvas.getContext('2d');
const cameraToggle = document.getElementById('cameraToggle');
const videoToggleButton = document.getElementById('videoToggleButton');
const errorMessage = document.getElementById('error-message');

let currentStream;
let videoOn = false;

function logMessage(message) {
    errorMessage.textContent += `${message}\n`;
    console.log(message);
}

async function startVideo(useFrontCamera = true) {
    const constraints = {
        video: {
            facingMode: useFrontCamera ? 'user' : 'environment'
        }
    };

    try {
        if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop());
            logMessage('Stopped existing video stream.');
        }
        currentStream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = currentStream;
        logMessage('Camera started successfully.');
        videoOn = true;
        videoToggleButton.textContent = 'Turn Video Off';
    } catch (err) {
        logMessage('Cannot access cameras because: ' + err.message);
    }
}

function stopVideo() {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        logMessage('Stopped video stream.');
    }
    video.srcObject = null;
    videoOn = false;
    videoToggleButton.textContent = 'Turn Video On';
}

Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
    faceapi.nets.faceExpressionNet.loadFromUri('/models')
]).then(() => {
    logMessage('Models loaded successfully.');
    videoToggleButton.addEventListener('click', () => {
        if (videoOn) {
            stopVideo();
        } else {
            startVideo(cameraToggle.checked);
        }
    });
}).catch(err => {
    logMessage('Failed to load models because: ' + err.message);
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
        }
    }, 100);
});

cameraToggle.addEventListener('change', () => {
    if (videoOn) {
        startVideo(cameraToggle.checked);
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
