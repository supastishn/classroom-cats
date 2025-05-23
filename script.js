// DOM Elements
const modal = document.getElementById('modal');
const startButton = document.getElementById('start-button');
const micToggle = document.getElementById('mic-toggle');
const micStatusIndicator = document.getElementById('mic-status-indicator');
const meterFill = document.querySelector('.meter-fill');
const noiseValue = document.querySelector('.noise-value');
const cat = document.getElementById('cat');
const statusText = document.querySelector('.status-text');
const statusIcon = document.querySelector('.status-indicator i');
const resetButton = document.getElementById('reset-button');
const creditsValue = document.getElementById('credits-value');

// Audio context and analyzer variables
let audioContext;
let analyser;
let microphone;
let javascriptNode;
let isListening = false;
let animationRunning = false;
let randomMovementInterval = null;
let creditsInterval = null;
let creditsLossInterval = null;
let lastNoiseLevel = -100; // Initial value

// Noise thresholds
const NOISE_THRESHOLD_AWAKE = -65; // dB
const NOISE_THRESHOLD_RUN = -45; // dB

// Cat states
const CAT_STATES = {
    SLEEPING: 'sleeping',
    AWAKE: 'awake',
    RUNNING: 'running'
};

let currentState = CAT_STATES.SLEEPING;
let credits = 0;

// Hide welcome modal if microphone access is already allowed
if (navigator.permissions && navigator.permissions.query) {
    navigator.permissions.query({ name: 'microphone' }).then(function(result) {
        if (result.state === 'granted') {
            modal.classList.add('hidden');
            initAudioContext();
        }
    });
}

// Initialize the application
startButton.addEventListener('click', () => {
    modal.classList.add('hidden');
    initAudioContext();
});

// Toggle microphone
micToggle.addEventListener('click', () => {
    if (isListening) {
        stopListening();
    } else {
        startListening();
    }
});

// Reset cat button
resetButton.addEventListener('click', () => {
    // Force reset to sleeping state regardless of noise level
    stopRandomMovement();
    currentState = CAT_STATES.SLEEPING;
    resetCat();
    statusText.textContent = 'Cat is sleeping peacefully';
    statusIcon.className = 'fas fa-moon';
    cat.classList.add(CAT_STATES.SLEEPING);
    
    // Reset credits
    credits = 0;
    updateCreditsDisplay();
});

// Initialize audio context
function initAudioContext() {
    try {
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        audioContext = new AudioContext();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.8;
        
        javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);
        javascriptNode.connect(audioContext.destination);
        
        startListening();
    } catch (e) {
        console.error('Web Audio API is not supported in this browser', e);
        micStatusIndicator.textContent = 'Microphone not supported in this browser';
        micStatusIndicator.style.color = 'red';
    }
}

// Start listening to microphone
function startListening() {
    if (audioContext && !isListening) {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(function(stream) {
                    microphone = audioContext.createMediaStreamSource(stream);
                    microphone.connect(analyser);
                    analyser.connect(javascriptNode);
                    
                    javascriptNode.onaudioprocess = processAudio;
                    
                    isListening = true;
                    updateMicUI(true);
                })
                .catch(function(err) {
                    console.error('Error accessing microphone:', err);
                    micStatusIndicator.textContent = 'Error accessing microphone: ' + err.message;
                    micStatusIndicator.style.color = 'red';
                });
        } else {
            micStatusIndicator.textContent = 'getUserMedia not supported in this browser';
            micStatusIndicator.style.color = 'red';
        }
    }
}

// Stop listening to microphone
function stopListening() {
    if (isListening && microphone) {
        microphone.disconnect();
        analyser.disconnect();
        javascriptNode.onaudioprocess = null;
        isListening = false;
        updateMicUI(false);
        
        // Stop any random movement when microphone is disabled
        stopRandomMovement();
        resetCat();
    }
}

// Update microphone UI elements
function updateMicUI(listening) {
    if (listening) {
        micToggle.innerHTML = '<i class="fas fa-microphone-slash"></i> Disable Microphone';
        micStatusIndicator.textContent = 'Microphone active';
        micStatusIndicator.style.color = 'green';
    } else {
        micToggle.innerHTML = '<i class="fas fa-microphone"></i> Enable Microphone';
        micStatusIndicator.textContent = 'Microphone disabled';
        micStatusIndicator.style.color = '#666';
        meterFill.style.width = '0%';
        noiseValue.textContent = '0 dB';
    }
}

// Process audio data
function processAudio(event) {
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);
    
    // Get average volume
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
    }
    const average = sum / bufferLength;
    
    // Convert to decibels (rough approximation)
    const db = average === 0 ? -100 : 20 * Math.log10(average / 255);
    
    // Update noise meter
    updateNoiseMeter(db);
    
    // Update cat state based on noise level
    updateCatState(db);
}

// Update noise meter UI
function updateNoiseMeter(db) {
    // Normalize dB value to percentage for meter display (-100dB to 0dB)
    const normalizedDb = Math.max(-100, Math.min(0, db));
    const percentage = 100 - (normalizedDb / -100) * 100;
    
    meterFill.style.width = `${percentage}%`;
    noiseValue.textContent = `${Math.round(db)} dB`;
}

// Update cat state based on noise level
function updateCatState(db) {
    lastNoiseLevel = db;
    let newState;
    if (db > window.NOISE_THRESHOLD_RUN) {
        newState = CAT_STATES.RUNNING;
    } else if (db > window.NOISE_THRESHOLD_AWAKE) {
        newState = CAT_STATES.AWAKE;
    } else {
        newState = CAT_STATES.SLEEPING;
    }
    if (newState !== currentState) {
        currentState = newState;
        updateCatUI(currentState);
    }
}

// Update cat UI based on state
function updateCatUI(state) {
    // Remove all state classes
    cat.classList.remove(CAT_STATES.SLEEPING, CAT_STATES.AWAKE, CAT_STATES.RUNNING);
    
    // Add the current state class
    cat.classList.add(state);
    
    // Update status text and icon
    switch (state) {
        case CAT_STATES.SLEEPING:
            statusText.textContent = 'Cat is sleeping peacefully';
            statusIcon.className = 'fas fa-moon';
            
            // If cat was running before, stop the random movement
            stopRandomMovement();
            resetCat();
            break;
        case CAT_STATES.AWAKE:
            statusText.textContent = 'Cat is awake and alert';
            statusIcon.className = 'fas fa-eye';
            
            // If cat was running before, stop the random movement
            stopRandomMovement();
            resetCat();
            break;
        case CAT_STATES.RUNNING:
            statusText.textContent = 'Cat is scared and running around!';
            statusIcon.className = 'fas fa-running';
            
            // Start continuous random movement
            startRandomMovement();
            break;
    }
    
    // Handle credits based on new state
    handleCreditsForState(state);
}

// Reset cat to sleeping state
function resetCat() {
    // Stop any random movement interval
    stopRandomMovement();
    
    cat.style.transition = 'none';
    cat.style.animation = 'none';
    cat.classList.remove(CAT_STATES.SLEEPING, CAT_STATES.AWAKE, CAT_STATES.RUNNING);
    
    // Reset any transforms applied by animations
    cat.style.transform = 'none';
    
    // Force reflow to ensure transition reset
    void cat.offsetWidth;
    
    // Restore transition and set to sleeping if current state is sleeping
    cat.style.transition = 'var(--transition)';
    if (currentState === CAT_STATES.SLEEPING) {
        cat.classList.add(CAT_STATES.SLEEPING);
    } else if (currentState === CAT_STATES.AWAKE) {
        cat.classList.add(CAT_STATES.AWAKE);
    }
}

// Set a random running direction for the cat
function setRandomRunningDirection() {
    const directions = [
        'runLeft',
        'runRight',
        'runUp',
        'runDown',
        'runUpLeft',
        'runUpRight',
        'runDownLeft',
        'runDownRight',
        'zigzag',
        'zigzagLeft'
    ];
    
    // Select a random direction
    const randomDirection = directions[Math.floor(Math.random() * directions.length)];
    
    // Apply the animation with shorter duration for continuous movement
    cat.style.animation = `${randomDirection} 1.5s forwards`;
}

// Start continuous random movement
function startRandomMovement() {
    // First, make sure we're not already running an interval
    stopRandomMovement();
    
    // Set initial random direction
    setRandomRunningDirection();
    
    // Set an interval to change direction every 1.5 seconds
    randomMovementInterval = setInterval(() => {
        // Only continue if noise is still high
        if (lastNoiseLevel > NOISE_THRESHOLD_RUN) {
            setRandomRunningDirection();
        } else {
            // If noise level has dropped, stop the random movement
            stopRandomMovement();
            
            // Update cat state based on current noise level
            let newState;
            if (lastNoiseLevel > NOISE_THRESHOLD_AWAKE) {
                newState = CAT_STATES.AWAKE;
            } else {
                newState = CAT_STATES.SLEEPING;
            }
            
            currentState = newState;
            updateCatUI(currentState);
        }
    }, 1500);
}

// Stop the continuous random movement
function stopRandomMovement() {
    if (randomMovementInterval) {
        clearInterval(randomMovementInterval);
        randomMovementInterval = null;
    }
}

// --- Credits Feature ---
function startCreditsGain() {
    stopCreditsGain();
    creditsInterval = setInterval(() => {
        credits += window.CREDIT_GAIN;
        updateCreditsDisplay();
    }, window.CREDIT_INTERVAL * 1000); // Customizable interval
}

function stopCreditsGain() {
    if (creditsInterval) {
        clearInterval(creditsInterval);
        creditsInterval = null;
    }
}

function startCreditsLoss() {
    stopCreditsLoss();
    creditsLossInterval = setInterval(() => {
        credits = Math.max(0, credits - window.CREDIT_LOSS); // Customizable loss
        updateCreditsDisplay();
    }, 1000);
}

function stopCreditsLoss() {
    if (creditsLossInterval) {
        clearInterval(creditsLossInterval);
        creditsLossInterval = null;
    }
}

function updateCreditsDisplay() {
    creditsValue.textContent = credits;
    if (currentState === CAT_STATES.RUNNING) {
        creditsValue.style.color = 'var(--loud-color)';
    } else if (currentState === CAT_STATES.AWAKE) {
        creditsValue.style.color = 'var(--moderate-color)';
    } else {
        creditsValue.style.color = 'var(--quiet-color)';
    }
}

// Call this whenever the cat state changes
function handleCreditsForState(state) {
    if (state === CAT_STATES.SLEEPING) {
        startCreditsGain();
        stopCreditsLoss();
    } else if (state === CAT_STATES.AWAKE) {
        stopCreditsGain();
        stopCreditsLoss();
    } else if (state === CAT_STATES.RUNNING) {
        stopCreditsGain();
        startCreditsLoss();
    }
}
// --- End Credits Feature ---

// --- Settings Feature ---
const settingsButton = document.getElementById('settings-button');
const settingsModal = document.getElementById('settings-modal');
const settingsForm = document.getElementById('settings-form');
const settingsCancel = document.getElementById('settings-cancel');
const awakeInput = document.getElementById('awake-threshold');
const runInput = document.getElementById('run-threshold');
const creditIntervalInput = document.getElementById('credit-interval');
const creditGainInput = document.getElementById('credit-gain');
const creditLossInput = document.getElementById('credit-loss');
const settingsResetDefault = document.getElementById('settings-reset-default');

// Default settings
const DEFAULT_SETTINGS = {
    awakeThreshold: -65,
    runThreshold: -45,
    creditInterval: 2,
    creditGain: 1,
    creditLoss: 2
};

function loadSettings() {
    const saved = JSON.parse(localStorage.getItem('classroomCatSettings') || 'null');
    return saved ? { ...DEFAULT_SETTINGS, ...saved } : { ...DEFAULT_SETTINGS };
}

function saveSettings(settings) {
    localStorage.setItem('classroomCatSettings', JSON.stringify(settings));
}

function applySettings(settings) {
    window.NOISE_THRESHOLD_AWAKE = settings.awakeThreshold;
    window.NOISE_THRESHOLD_RUN = settings.runThreshold;
    window.CREDIT_INTERVAL = settings.creditInterval;
    window.CREDIT_GAIN = settings.creditGain;
    window.CREDIT_LOSS = settings.creditLoss;
}

function updateSettingsForm(settings) {
    awakeInput.value = settings.awakeThreshold;
    runInput.value = settings.runThreshold;
    creditIntervalInput.value = settings.creditInterval;
    creditGainInput.value = settings.creditGain;
    creditLossInput.value = settings.creditLoss;
}

// Modal open/close
settingsButton.addEventListener('click', () => {
    const settings = loadSettings();
    updateSettingsForm(settings);
    settingsModal.classList.remove('hidden');
});
settingsCancel.addEventListener('click', () => {
    settingsModal.classList.add('hidden');
});
settingsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const newSettings = {
        awakeThreshold: parseInt(awakeInput.value, 10),
        runThreshold: parseInt(runInput.value, 10),
        creditInterval: parseInt(creditIntervalInput.value, 10),
        creditGain: parseInt(creditGainInput.value, 10),
        creditLoss: parseInt(creditLossInput.value, 10)
    };
    saveSettings(newSettings);
    applySettings(newSettings);
    settingsModal.classList.add('hidden');
    // Restart credits logic to use new settings
    stopCreditsGain();
    stopCreditsLoss();
    handleCreditsForState(currentState);
});
// Close modal on outside click
settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) settingsModal.classList.add('hidden');
});

// Reset to default settings
settingsResetDefault.addEventListener('click', () => {
    updateSettingsForm(DEFAULT_SETTINGS);
});

// On load, apply settings
const initialSettings = loadSettings();
applySettings(initialSettings);
// --- End Settings Feature ---

// Handle page visibility changes to manage audio context
document.addEventListener('visibilitychange', () => {
    if (document.hidden && isListening) {
        stopListening();
        stopRandomMovement();
    }
});

// Ensure audio context is resumed after user interaction
document.addEventListener('click', () => {
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume();
    }
});
