<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Live Emotion Detection</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <h1>Live Emotion Detection</h1>
    <div id="video-container">
        <video id="video" autoplay muted playsinline></video>
        <canvas id="overlay"></canvas>
        <div id="emotion-label"></div>
    </div>
    <div class="button-container">
        <button id="switchCameraButton">🔁</button>
        <button id="startRecordingButton">🎦</button>
    </div>
    <p id="error-message">No errors</p>
    <ul id="emotion-output"></ul>
    <script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@3.11.0/dist/tf.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js"></script>
    <script src="index.js"></script>
</body>
</html>
