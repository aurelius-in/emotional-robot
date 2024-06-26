// Simple TensorFlow.js example to verify setup

const output = document.getElementById('output');

async function runExample() {
    try {
        // Create a simple model
        const model = tf.sequential();
        model.add(tf.layers.dense({units: 1, inputShape: [1]}));
        model.compile({optimizer: 'sgd', loss: 'meanSquaredError'});

        // Generate some synthetic data for training
        const xs = tf.tensor2d([1, 2, 3, 4], [4, 1]);
        const ys = tf.tensor2d([1, 3, 5, 7], [4, 1]);

        // Train the model using the data
        await model.fit(xs, ys, {epochs: 10});

        // Use the model to make a prediction
        const prediction = model.predict(tf.tensor2d([5], [1, 1])).arraySync();

        output.innerText = `Prediction for input 5: ${prediction}`;
        console.log(`Prediction for input 5: ${prediction}`);
    } catch (error) {
        output.innerText = `Error: ${error.message}`;
        console.error(`Error: ${error.message}`);
    }
}

runExample();
