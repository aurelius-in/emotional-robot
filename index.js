const video = document.getElementById('video');
const videoToggleButton = document.getElementById('videoToggleButton');
const errorMessage = document.getElementById('error-message');

let currentStream;
let videoOn = false;

function logMessage(message) {
    errorMessage.textContent = `${message}`;
    console.log(message);
}

async function startVideo() {
    try {
        const constraints = {
            video: {
                facingMode: 'user'
            }
        };
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

videoToggleButton.addEventListener('click', () => {
    if (videoOn) {
        stopVideo();
    } else {
        startVideo();
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
