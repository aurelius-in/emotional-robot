const video = document.getElementById('video');
const canvas = document.getElementById('overlay');
const context = canvas.getContext('2d');
const cameraToggle = document.getElementById('cameraToggle');
const videoToggleButton = document.getElementById('videoToggleButton');
const errorMessage = document.getElementById('error-message');

let currentStream;
let videoOn = false;

async function startVideo(useFrontCamera = true) {
    const constraints = {
        video: {
            facingMode: useFrontCamera ? 'user' : 'environment'
        }
    };

    try {
        if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop());
        }
        currentStream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = currentStream;
        console.log('Camera started successfully');
        errorMessage.textContent = 'No errors';
        videoOn = true;
        videoToggleButton.textContent = 'Turn Video Off';
    } catch (err) {
        errorMessage.textContent = 'Cannot access cameras because ' + err.message;
        console.error('Error accessing webcam:', err);
    }
}

function stopVideo() {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
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
    videoToggleButton.addEventListener('click', () => {
        if (videoOn) {
            stopVideo();
        } else {
            startVideo(cameraToggle.checked);
        }
    });
}).catch(err => {
    errorMessage.textContent = 'Failed to load models because ' + err.message;
    console.error('Failed to load models:', err);
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
        console.log('Camera permissions granted');
        errorMessage.textContent = 'Camera permissions granted';
    })
    .catch(err => {
        errorMessage.textContent = 'Cannot access cameras because ' + err.message;
        console.error('Permission error:', err);
    });
