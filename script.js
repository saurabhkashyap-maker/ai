// --- CONFIGURATION ---
// IMPORTANT: Never hardcode your API key directly in a file you push to GitHub.
// See the deployment section for how to handle this safely.
const GEMINI_API_KEY = 'YOUR_API_KEY_HERE';
const GEMINI_MODEL = 'gemini-2.5-flash'; // Free tier friendly model [citation:7]

// --- DOM ELEMENTS ---
const orb = document.getElementById('orb');
const orbWrapper = document.querySelector('.orb-wrapper');
const statusLabel = document.getElementById('status');
const userTextEl = document.getElementById('user-text');
const aiTextEl = document.getElementById('ai-text');

// --- STATE ---
let state = 'idle'; // idle | listening | thinking | speaking
let recognition = null;
let synth = window.speechSynthesis;
let currentUtterance = null;

// --- SPEECH RECOGNITION SETUP ---
function initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
        statusLabel.textContent = "Speech recognition not supported in this browser.";
        return null;
    }
    
    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-US';
    
    rec.onstart = () => {
        setState('listening');
    };
    
    rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        userTextEl.textContent = `"${transcript}"`;
        setState('thinking');
        sendToGemini(transcript);
    };
    
    rec.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setState('idle');
        statusLabel.textContent = "Error: " + event.error;
    };
    
    rec.onend = () => {
        // If recognition ends without a result, go back to idle
        if (state === 'listening') {
            setState('idle');
        }
    };
    
    return rec;
}

// --- GEMINI API CALL ---
async function sendToGemini(prompt) {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_API_KEY_HERE') {
        aiTextEl.textContent = "API key not configured.";
        setState('idle');
        return;
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
    
    const requestBody = {
        contents: [{
            parts: [{ text: prompt }]
        }]
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': GEMINI_API_KEY
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        const aiResponse = data.candidates[0].content.parts[0].text;
        
        aiTextEl.textContent = aiResponse;
        speakResponse(aiResponse);

    } catch (error) {
        console.error('Gemini API error:', error);
        aiTextEl.textContent = "Sorry, I couldn't process that.";
        setState('idle');
    }
}

// --- TEXT-TO-SPEECH ---
function speakResponse(text) {
    // Cancel any ongoing speech
    synth.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Try to pick a good voice
    const voices = synth.getVoices();
    const preferredVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) || 
                           voices.find(v => v.lang.startsWith('en'));
    if (preferredVoice) {
        utterance.voice = preferredVoice;
    }
    
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    utterance.onstart = () => {
        setState('speaking');
    };
    
    utterance.onend = () => {
        setState('idle');
    };
    
    utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        setState('idle');
    };
    
    currentUtterance = utterance;
    synth.speak(utterance);
}

// --- STATE MANAGEMENT ---
function setState(newState) {
    state = newState;
    
    // Update classes on wrapper for CSS animations
    orbWrapper.className = 'orb-wrapper ' + newState;
    
    // Update the orb class for equalizer
    orb.className = 'orb ' + newState;
    
    // Update label
    switch (newState) {
        case 'idle':
            statusLabel.textContent = 'Tap to speak';
            break;
        case 'listening':
            statusLabel.textContent = 'Listening...';
            break;
        case 'thinking':
            statusLabel.textContent = 'Thinking...';
            break;
        case 'speaking':
            statusLabel.textContent = 'Speaking...';
            break;
    }
}

// --- INTERACTION ---
function handleOrbClick() {
    // Barge-in: If speaking, stop speaking and start listening
    if (state === 'speaking') {
        synth.cancel();
        setState('idle');
        // Small delay to let the cancel process
        setTimeout(() => startListening(), 100);
        return;
    }
    
    // Ignore clicks while thinking
    if (state === 'thinking') {
        return;
    }
    
    // Toggle listening
    if (state === 'listening') {
        recognition.stop();
        setState('idle');
    } else {
        startListening();
    }
}

function startListening() {
    if (!recognition) {
        recognition = initSpeechRecognition();
    }
    
    if (recognition) {
        userTextEl.textContent = '';
        aiTextEl.textContent = '';
        recognition.start();
    }
}

// --- INITIALIZATION ---
function init() {
    recognition = initSpeechRecognition();
    
    // Load voices (sometimes async)
    synth.getVoices();
    if (synth.onvoiceschanged !== undefined) {
        synth.onvoiceschanged = () => synth.getVoices();
    }
    
    orb.addEventListener('click', handleOrbClick);
    setState('idle');
}

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
