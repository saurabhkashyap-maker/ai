// ============================================
// CONFIGURATION
// ============================================
const GEMINI_API_KEY = 'AIzaSyDDT4uSLYdqGi42N4bzi3d9yuI2YTOU4yc';
const GEMINI_MODEL = 'gemini-2.0-flash'; // ✅ FIX: 2.0-flash has wider free access than 2.5

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
let voicesReady = false;

// ============================================
// VOICES — load them properly (this was a big cause of silence)
// ============================================
function loadVoices() {
    return new Promise((resolve) => {
        const voices = synth.getVoices();
        if (voices.length > 0) {
            voicesReady = true;
            resolve(voices);
            return;
        }
        // Voices load async in Chrome — wait for them
        synth.onvoiceschanged = () => {
            voicesReady = true;
            resolve(synth.getVoices());
        };
        // Fallback timeout
        setTimeout(() => resolve(synth.getVoices()), 1500);
    });
}

// ============================================
// SPEECH RECOGNITION
// ============================================
function initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        statusLabel.textContent = "Use Chrome — speech not supported here.";
        return null;
    }

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-US';
    rec.maxAlternatives = 1;

    rec.onstart = () => setState('listening');

    rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        userTextEl.textContent = `You: "${transcript}"`;
        setState('thinking');
        sendToGemini(transcript);
    };

    rec.onerror = (event) => {
        console.warn('Speech error:', event.error);

        // ✅ FIX: these are harmless, don't show as errors
        if (event.error === 'aborted' || event.error === 'no-speech') {
            setState('idle');
            return;
        }
        if (event.error === 'not-allowed') {
            statusLabel.textContent = "Mic blocked. Allow access in browser.";
            setState('idle');
            return;
        }
        statusLabel.textContent = "Mic error: " + event.error;
        setState('idle');
    };

    rec.onend = () => {
        if (state === 'listening') setState('idle');
    };

    return rec;
}

// ============================================
// GEMINI API
// ============================================
async function sendToGemini(prompt) {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'PASTE_YOUR_API_KEY_HERE') {
        aiTextEl.textContent = "API key missing in script.js";
        setState('idle');
        return;
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

    const requestBody = {
        contents: [{
            parts: [{
                text: "You are a helpful, friendly voice assistant. Reply in 1-2 short sentences because your answer is spoken aloud. User said: " + prompt
            }]
        }]
    };

    try {
        aiTextEl.textContent = "Thinking...";

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        // ✅ FIX: surface the real API error so you can see what's wrong
        if (!response.ok) {
            console.error('API error:', data);
            const msg = data?.error?.message || `HTTP ${response.status}`;
            aiTextEl.textContent = "API error: " + msg;
            setState('idle');
            return;
        }

        // ✅ FIX: safe check — Google sometimes returns no candidates
        const aiResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!aiResponse) {
            console.error('Bad response shape:', data);
            aiTextEl.textContent = "Empty reply from Gemini.";
            setState('idle');
            return;
        }

        aiTextEl.textContent = aiResponse;
        speakResponse(aiResponse);

    } catch (error) {
        console.error('Fetch failed:', error);
        aiTextEl.textContent = "Network error: " + error.message;
        setState('idle');
    }
}

// ============================================
// TEXT-TO-SPEECH  ✅ FIX: rewritten to actually speak
// ============================================
async function speakResponse(text) {
    // Chrome bug: if synthesis is stuck, cancel and resume clears it
    synth.cancel();

    if (!voicesReady) await loadVoices();

    // Strip markdown/emojis so it reads cleanly
    const clean = text
        .replace(/[*_`#>]/g, '')
        .replace(/\[.*?\]\(.*?\)/g, '')
        .replace(/[\u{1F300}-\u{1FAFF}]/gu, '')
        .trim();

    const utterance = new SpeechSynthesisUtterance(clean);

    // Pick a voice
    const voices = synth.getVoices();
    const preferred =
        voices.find(v => v.name.includes('Google US English')) ||
        voices.find(v => v.lang === 'en-US' && v.name.toLowerCase().includes('female')) ||
        voices.find(v => v.lang === 'en-US') ||
        voices.find(v => v.lang.startsWith('en'));
    if (preferred) utterance.voice = preferred;

    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    utterance.lang = 'en-US';

    utterance.onstart = () => {
        console.log('🔊 Speaking started');
        setState('speaking');
    };
    utterance.onend = () => {
        console.log('🔊 Speaking ended');
        setState('idle');
    };
    utterance.onerror = (e) => {
        console.error('🔊 Speech error:', e.error);
        setState('idle');
    };

    // ✅ FIX: wait a tick — Chrome sometimes silently drops speech if called too fast
    setTimeout(() => {
        synth.speak(utterance);
        // Chrome bug: long text gets cut at 15s. This "keep alive" workaround:
        const keepAlive = setInterval(() => {
            if (!synth.speaking) {
                clearInterval(keepAlive);
                return;
            }
            synth.pause();
            synth.resume();
        }, 10000);
    }, 100);
}

// ============================================
// STATE
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
    // ✅ FIX: hard-stop any prior recognition before starting new one
    if (recognition && state === 'listening') {
        try { recognition.abort(); } catch(e){}
        setState('idle');
        return;
    }

    if (state === 'speaking') {
        synth.cancel();
        setState('idle');
        return;
    }

    if (state === 'thinking') return;

    startListening();
}

function startListening() {
    if (!recognition) recognition = initSpeechRecognition();
    if (!recognition) return;

    userTextEl.textContent = '';
    aiTextEl.textContent = '';

    try {
        recognition.start();
    } catch (e) {
        // Chrome throws if already started — abort & restart
        try { recognition.abort(); } catch(_){}
        setTimeout(() => {
            try { recognition.start(); } catch(_){}
        }, 200);
    }
}

// ============================================
// INIT
// ============================================
function init() {
    recognition = initSpeechRecognition();
    loadVoices();

    // ✅ FIX: prime speechSynthesis on first tap (Chrome blocks until user gesture)
    document.body.addEventListener('click', () => {
        if (!synth.speaking && synth.paused) synth.resume();
    }, { once: true });

    orb.addEventListener('click', handleOrbClick);
    setState('idle');

    console.log('✅ Assistant ready');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
