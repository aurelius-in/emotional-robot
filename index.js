const video = document.getElementById('video');
const canvas = document.getElementById('overlay');
const context = canvas.getContext('2d');
const permissionsPrompt = document.getElementById('permissions-prompt');

Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
    faceapi.nets.faceExpressionNet.loadFromUri('/models')
]).then(startVideo).catch(err => console.error('Failed to load models:', err));

function startVideo() {
    navigator.mediaDevices.getUserMedia({ video: {} })
        .then(stream => {
            video.srcObject = stream;
            permissionsPrompt.style.display = 'none';
        })
        .catch(err => {
            console.error('Error accessing webcam:', err);
            permissionsPrompt.style.display = 'block';
            permissionsPrompt.innerText = 'Please enable camera permissions in your browser settings. On Samsung, go to Settings > Apps > Your Browser > Permissions. On iPhone, go to Settings > Your Browser > Camera.';
        });
}

video.addEventListener('play', () => {
    console.log('Video playing');
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
