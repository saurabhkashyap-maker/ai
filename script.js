// ============================================
// CONFIGURATION — CHANGE ONLY THIS LINE
// ============================================
const GEMINI_API_KEY = 'PASTE_YOUR_API_KEY_HERE';
const GEMINI_MODEL = 'gemini-2.5-flash';

// ============================================
// DOM ELEMENTS
// ============================================
const orb = document.getElementById('orb');
const orbWrapper = document.getElementById('orb-wrapper');
const statusLabel = document.getElementById('status');
const userTextEl = document.getElementById('user-text');
const aiTextEl = document.getElementById('ai-text');

// ============================================
// STATE
// ============================================
let state = 'idle';
let recognition = null;
let synth = window.speechSynthesis;

// ============================================
// SPEECH RECOGNITION SETUP
// ============================================
function initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        statusLabel.textContent = "Speech recognition not supported. Use Chrome.";
        return null;
    }

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-US';

    rec.onstart = () => setState('listening');

    rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        userTextEl.textContent = `You: "${transcript}"`;
        setState('thinking');
        sendToGemini(transcript);
    };

    rec.onerror = (event) => {
        console.error('Speech error:', event.error);
        if (event.error === 'not-allowed') {
            statusLabel.textContent = "Microphone blocked. Allow access.";
        } else if (event.error === 'no-speech') {
            statusLabel.textContent = "No speech detected. Try again.";
        } else {
            statusLabel.textContent = "Error: " + event.error;
        }
        setState('idle');
    };

    rec.onend = () => {
        if (state === 'listening') setState('idle');
    };

    return rec;
}

// ============================================
// GEMINI API CALL
// ============================================
async function sendToGemini(prompt) {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'PASTE_YOUR_API_KEY_HERE') {
        aiTextEl.textContent = "API key not configured. Edit script.js.";
        setState('idle');
        return;
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

    const requestBody = {
        contents: [{
            parts: [{
                text: "You are a helpful, friendly voice assistant. Give short, conversational answers (2-3 sentences max) since your reply will be spoken aloud. " + prompt
            }]
        }]
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error('API Error:', errText);
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        const aiResponse = data.candidates[0].content.parts[0].text;

        aiTextEl.textContent = aiResponse;
        speakResponse(aiResponse);

    } catch (error) {
        console.error('Gemini error:', error);
        aiTextEl.textContent = "Sorry, I couldn't reach Gemini. Check your API key.";
        setState('idle');
    }
}

// ============================================
// TEXT-TO-SPEECH
// ============================================
function speakResponse(text) {
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    const voices = synth.getVoices();
    const preferred = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) ||
                      voices.find(v => v.lang.startsWith('en-US')) ||
                      voices.find(v => v.lang.startsWith('en'));
    if (preferred) utterance.voice = preferred;

    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => setState('speaking');
    utterance.onend = () => setState('idle');
    utterance.onerror = () => setState('idle');

    synth.speak(utterance);
}

// ============================================
// STATE MANAGEMENT
// ============================================
function setState(newState) {
    state = newState;
    orbWrapper.className = 'orb-wrapper ' + newState;
    orb.className = 'orb ' + newState;

    switch (newState) {
        case 'idle':      statusLabel.textContent = 'Tap to speak'; break;
        case 'listening': statusLabel.textContent = 'Listening...'; break;
        case 'thinking':  statusLabel.textContent = 'Thinking...'; break;
        case 'speaking':  statusLabel.textContent = 'Speaking...'; break;
    }
}

// ============================================
// INTERACTION
// ============================================
function handleOrbClick() {
    if (state === 'speaking') {
        synth.cancel();
        setState('idle');
        setTimeout(startListening, 150);
        return;
    }

    if (state === 'thinking') return;

    if (state === 'listening') {
        recognition.stop();
        setState('idle');
    } else {
        startListening();
    }
}

function startListening() {
    if (!recognition) recognition = initSpeechRecognition();
    if (!recognition) return;

    userTextEl.textContent = '';
    aiTextEl.textContent = '';

    try {
        recognition.start();
    } catch (e) {
        // already started
    }
}

// ============================================
// INIT
// ============================================
function init() {
    recognition = initSpeechRecognition();

    synth.getVoices();
    if (synth.onvoiceschanged !== undefined) {
        synth.onvoiceschanged = () => synth.getVoices();
    }

    orb.addEventListener('click', handleOrbClick);
    setState('idle');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
