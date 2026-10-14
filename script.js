// Your exact Teachable Machine model URL
const URL = "https://teachablemachine.withgoogle.com/models/UzDcBCbRb/";

let model, webcam, labelContainer, maxPredictions;
let lastPredictionTime = 0;
const PREDICTION_INTERVAL = 80; // Throttles calculations to keep it smooth and lag-free

async function init() {
    try {
        await tf.setBackend('webgl');
        await tf.ready();

        const modelURL = URL + "model.json";
        const metadataURL = URL + "metadata.json";

        // Load your trained image model and metadata
        model = await tmImage.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();

        // Setup webcam automatically on page load
        const size = 220;
        const flip = true;
        webcam = new tmImage.Webcam(size, size, flip);
        await webcam.setup();
        await webcam.play();
        window.requestAnimationFrame(loop);

        // Append canvas to DOM and clear loading text
        const canvasContainer = document.getElementById("webcam-container");
        canvasContainer.innerHTML = ""; 
        canvasContainer.appendChild(webcam.canvas);
        
        labelContainer = document.getElementById("label-container");
        labelContainer.innerHTML = "";
        
        for (let i = 0; i < maxPredictions; i++) {
            const row = document.createElement("div");
            labelContainer.appendChild(row);
        }
    } catch (error) {
        console.error("Initialization error:", error);
    }
}

async function loop(timestamp) {
    webcam.update(); // Update webcam frame smoothly
    
    if (timestamp - lastPredictionTime > PREDICTION_INTERVAL) {
        await predict();
        lastPredictionTime = timestamp;
    }
    
    window.requestAnimationFrame(loop);
}

async function predict() {
    if (!model) return;

    // Run prediction on the webcam canvas frame
    const prediction = await model.predict(webcam.canvas);

    // Accent colors for your gesture progress bars
    const barColors = ['#f97316', '#ec4899', '#8b5cf6', '#3b82f6', '#10b981'];

    for (let i = 0; i < maxPredictions; i++) {
        const className = prediction[i].className;
        const probability = (prediction[i].probability * 100).toFixed(0);
        const barColor = barColors[i % barColors.length];
        
        if (labelContainer.childNodes[i]) {
            labelContainer.childNodes[i].innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem; font-weight: 600; color: #4b5563;">
                    <span>${className}</span>
                    <span style="font-size: 0.75rem; background: #edf2f7; padding: 1px 6px; border-radius: 4px; color: #334155;">${probability}%</span>
                </div>
                <div style="background: #edf2f7; border-radius: 3px; overflow: hidden; height: 8px; width: 100%;">
                    <div style="background: ${barColor}; width: ${probability}%; height: 100%; transition: width 0.1s ease-out;"></div>
                </div>
            `;
        }
    }
}

// Automatically start the app when the script loads
init();