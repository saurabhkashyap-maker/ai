// ============================================
// NO-API VOICE ASSISTANT
// All commands handled locally in your browser
// ============================================

const orb = document.getElementById('orb');
const orbWrapper = document.getElementById('orb-wrapper');
const statusLabel = document.getElementById('status');
const userTextEl = document.getElementById('user-text');
const aiTextEl = document.getElementById('ai-text');

let state = 'idle';
let recognition = null;
let synth = window.speechSynthesis;
let voices = [];

// ---------- Log helper ----------
function log(msg) {
    console.log(msg);
    statusLabel.textContent = msg;
}

// ---------- Load voices ----------
function loadVoices() {
    voices = synth.getVoices();
    if (voices.length === 0) {
        synth.onvoiceschanged = () => { voices = synth.getVoices(); };
    }
}
loadVoices();

// ============================================
// 💬 COMMAND DATABASE
// Each entry: { match: [keywords], run: function }
// If ANY keyword appears in what you said, it runs
// ============================================
const COMMANDS = [
    // --- Websites ---
    {
        match: ['open youtube', 'youtube kholo', 'launch youtube'],
        run: () => {
            reply('Opening YouTube');
            open('https://youtube.com');
        }
    },
    {
        match: ['open google', 'google kholo'],
        run: () => {
            reply('Opening Google');
            open('https://google.com');
        }
    },
    {
        match: ['open github', 'github kholo'],
        run: () => {
            reply('Opening GitHub');
            open('https://github.com');
        }
    },
    {
        match: ['open whatsapp', 'whatsapp kholo'],
        run: () => {
            reply('Opening WhatsApp');
            open('https://web.whatsapp.com');
        }
    },
    {
        match: ['open gmail', 'open email', 'gmail kholo'],
        run: () => {
            reply('Opening Gmail');
            open('https://mail.google.com');
        }
    },
    {
        match: ['open instagram', 'instagram kholo'],
        run: () => {
            reply('Opening Instagram');
            open('https://instagram.com');
        }
    },
    {
        match: ['open maps', 'open google maps'],
        run: () => {
            reply('Opening Maps');
            open('https://maps.google.com');
        }
    },
    {
        match: ['open chatgpt', 'open chat gpt'],
        run: () => {
            reply('Opening ChatGPT');
            open('https://chat.openai.com');
        }
    },

    // --- Time & Date ---
    {
        match: ['what time', 'time now', 'current time', 'time kya'],
        run: () => {
            const t = new Date().toLocaleTimeString('en-IN', {
                hour: '2-digit', minute: '2-digit'
            });
            reply('The time is ' + t);
        }
    },
    {
        match: ['what date', 'today date', "today's date", 'date kya'],
        run: () => {
            const d = new Date().toLocaleDateString('en-IN', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
            });
            reply('Today is ' + d);
        }
    },

    // --- Greetings ---
    {
        match: ['hello', 'hi ', 'hey ', 'namaste'],
        run: () => {
            const opts = ['Hello! How can I help?', 'Hi there!', 'Hey! What can I do?'];
            reply(opts[Math.floor(Math.random() * opts.length)]);
        }
    },
    {
        match: ['good morning'],
        run: () => reply('Good morning! Hope you have a great day.')
    },
    {
        match: ['good night'],
        run: () => reply('Good night! Sleep well.')
    },
    {
        match: ['how are you', 'kaise ho'],
        run: () => reply("I'm doing great, thank you for asking!")
    },
    {
        match: ['your name', 'who are you', 'tum kaun'],
        run: () => reply('I am your personal AI assistant.')
    },
    {
        match: ['thank you', 'thanks', 'shukriya'],
        run: () => reply('You are welcome!')
    },
    {
        match: ['bye', 'goodbye'],
        run: () => reply('Goodbye! See you soon.')
    },

    // --- Search ---
    {
        match: ['search for', 'google search', 'search karo'],
        run: (said) => {
            const q = said.replace(/.*(search for|google search|search karo)/i, '').trim();
            if (!q) return reply('What should I search for?');
            reply('Searching for ' + q);
            open('https://www.google.com/search?q=' + encodeURIComponent(q));
        }
    },
    {
        match: ['play on youtube', 'youtube pe'],
        run: (said) => {
            const q = said.replace(/.*(play on youtube|youtube pe)/i, '').trim();
            if (!q) return reply('What should I play?');
            reply('Playing ' + q + ' on YouTube');
            open('https://www.youtube.com/results?search_query=' + encodeURIComponent(q));
        }
    },
    {
        match: ['wikipedia', 'who is', 'what is'],
        run: (said) => {
            const q = said.replace(/.*(wikipedia|who is|what is)/i, '').trim();
            if (!q) return reply('What should I look up?');
            reply('Looking up ' + q);
            open('https://en.wikipedia.org/wiki/Special:Search?search=' + encodeURIComponent(q));
        }
    },

    // --- Math ---
    {
        match: ['calculate', 'what is', 'plus', 'minus', 'times', 'divided by'],
        run: (said) => {
            const result = tryMath(said);
            if (result !== null) reply('The answer is ' + result);
            else reply("Sorry, I couldn't calculate that.");
        }
    },

    // --- Utility ---
    {
        match: ['stop', 'be quiet', 'silence', 'chup'],
        run: () => {
            synth.cancel();
            setState('idle');
        }
    },
    {
        match: ['clear', 'reset'],
        run: () => {
            userTextEl.textContent = '';
            aiTextEl.textContent = '';
            reply('Cleared.');
        }
    }
];

// ============================================
// 🧮 Simple math parser
// ============================================
function tryMath(text) {
    const t = text.toLowerCase()
        .replace(/what is|calculate|equals?/g, '')
        .replace(/plus/g, '+')
        .replace(/minus/g, '-')
        .replace(/times|multiplied by/g, '*')
        .replace(/divided by/g, '/')
        .replace(/[^0-9+\-*/.() ]/g, '')
        .trim();
    if (!/[0-9]/.test(t) || !/[+\-*/]/.test(t)) return null;
    try {
        const val = Function('"use strict"; return (' + t + ')')();
        return typeof val === 'number' && isFinite(val) ? val : null;
    } catch { return null; }
}

// ============================================
// 🚀 Command handler
// ============================================
function handleCommand(said) {
    const lower = ' ' + said.toLowerCase() + ' ';

    for (const cmd of COMMANDS) {
        for (const kw of cmd.match) {
            if (lower.includes(kw.toLowerCase())) {
                try { cmd.run(said); }
                catch (e) { console.error(e); reply("Something went wrong."); }
                return true;
            }
        }
    }
    return false;
}

// ============================================
// 💬 Reply (text + voice)
// ============================================
function reply(text) {
    aiTextEl.textContent = text;
    speak(text);
}

function speak(text) {
    synth.cancel();
    const clean = text.replace(/[*_`#>]/g, '').replace(/[\u{1F300}-\u{1FAFF}]/gu, '').trim();

    const u = new SpeechSynthesisUtterance(clean);
    const v = voices.find(x => x.name.includes('Google US English'))
           || voices.find(x => x.lang === 'en-US')
           || voices.find(x => x.lang.startsWith('en'));
    if (v) u.voice = v;
    u.rate = 1; u.pitch = 1; u.volume = 1;

    u.onstart = () => setState('speaking');
    u.onend   = () => setState('idle');
    u.onerror = () => setState('idle');

    setTimeout(() => synth.speak(u), 100);
}

// ============================================
// 🌐 Open URL (with popup-blocker fallback)
// ============================================
function open(url) {
    // Try new tab. If blocked, navigate current tab.
    const w = window.open(url, '_blank');
    if (!w || w.closed || typeof w.closed === 'undefined') {
        // Popup blocked — fall back to same-tab navigation
        setTimeout(() => { window.location.href = url; }, 800);
    }
}

// ============================================
// 🎤 Speech recognition
// ============================================
function initRec() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { log('Use Chrome — speech not supported'); return null; }

    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-US';

    rec.onstart = () => setState('listening');

    rec.onresult = (e) => {
        const t = e.results[0][0].transcript;
        userTextEl.textContent = `You: "${t}"`;
        setState('thinking');

        // Small delay so the UI shows "thinking"
        setTimeout(() => {
            const handled = handleCommand(t);
            if (!handled) {
                reply("Sorry, I don't know that command yet.");
            }
        }, 200);
    };

    rec.onerror = (e) => {
        console.warn('Rec error:', e.error);
        if (e.error === 'aborted' || e.error === 'no-speech') { setState('idle'); return; }
        if (e.error === 'not-allowed') { log('Mic blocked — allow in browser'); setState('idle'); return; }
        log('Mic: ' + e.error);
        setState('idle');
    };

    rec.onend = () => { if (state === 'listening') setState('idle'); };
    return rec;
}

// ============================================
// 🎛 State
// ============================================
function setState(s) {
    state = s;
    orbWrapper.className = 'orb-wrapper ' + s;
    orb.className = 'orb ' + s;
    if (s === 'idle')      log('Tap to speak');
    if (s === 'listening') log('Listening...');
    if (s === 'thinking')  log('Thinking...');
    if (s === 'speaking')  log('Speaking...');
}

// ============================================
// 👆 Interaction
// ============================================
function tapOrb() {
    if (state === 'listening') { try { recognition.abort(); } catch(e){} setState('idle'); return; }
    if (state === 'speaking')  { synth.cancel(); setState('idle'); return; }
    if (state === 'thinking')  return;

    if (!recognition) recognition = initRec();
    if (!recognition) return;

    userTextEl.textContent = '';
    aiTextEl.textContent = '';
    try { recognition.start(); } catch(e) {
        try { recognition.abort(); } catch(_){}
        setTimeout(() => { try { recognition.start(); } catch(_){} }, 250);
    }
}

// ============================================
// 🚀 Init
// ============================================
orb.addEventListener('click', tapOrb);
setState('idle');
console.log('✅ No-API assistant ready');
