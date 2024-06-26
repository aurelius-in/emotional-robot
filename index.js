const video = document.getElementById('video');
const canvas = document.getElementById('overlay');
const context = canvas.getContext('2d');
const cameraToggle = document.getElementById('cameraToggle');
const errorMessage = document.getElementById('error-message');

let currentStream;

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
        errorMessage.textContent = 'Camera is successfully accessed. Please allow permissions if prompted.';
    } catch (err) {
        errorMessage.textContent = 'Error accessing webcam: ' + err.message;
        console.error('Error accessing webcam:', err);
    }
}

Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
    faceapi.nets.faceExpressionNet.loadFromUri('/models')
]).then(() => startVideo()).catch(err => {
    errorMessage.textContent = 'Failed to load models: ' + err.message;
    console.error('Failed to load models:', err);
});

video.addEventListener('play', () => {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const displaySize = { width: video.videoWidth, height: video.videoHeight };
    faceapi.matchDimensions(canvas, displaySize);

    setInterval(async () => {
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceExpressions();
        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        context.clearRect(0, 0, canvas.width, canvas.height);
        faceapi.draw.drawDetections(canvas, resizedDetections);
        faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
        faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
    }, 100);
});

cameraToggle.addEventListener('change', () => {
    const useFrontCamera = cameraToggle.checked;
    startVideo(useFrontCamera);
});
