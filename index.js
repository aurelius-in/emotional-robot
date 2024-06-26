const video = document.getElementById('video');
const startButton = document.getElementById('startButton');
const errorMessage = document.getElementById('error-message');

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

        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
        logMessage('Camera started successfully.');
    } catch (error) {
        logMessage('Error accessing camera: ' + error.message);
    }
}

startButton.addEventListener('click', startCamera);
