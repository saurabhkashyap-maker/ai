// ============================================================
// Minimal GitHub Pages Voice Assistant
// ============================================================

console.log('🚀 Script loaded');

// Wait until DOM is ready
window.addEventListener('DOMContentLoaded', () => {

    const orb         = document.getElementById('orb');
    const orbWrapper  = document.getElementById('orb-wrapper');
    const statusLabel = document.getElementById('status');
    const userTextEl  = document.getElementById('user-text');
    const aiTextEl    = document.getElementById('ai-text');

    console.log('🔍 Elements found:', {
        orb: !!orb,
        status: !!statusLabel,
        userText: !!userTextEl,
        aiText: !!aiTextEl
    });

    if (!orb) {
        console.error('❌ orb element not found. Check index.html');
        return;
    }

    let recognition = null;
    let isListening = false;
    const synth = window.speechSynthesis;

    // ---------- SPEAK ----------
    function speak(text) {
        console.log('🔊 speak():', text);
        synth.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'en-US';
        u.rate = 1;
        u.pitch = 1;
        u.volume = 1;

        u.onstart = () => {
            console.log('🔊 speech started');
            statusLabel.textContent = 'Speaking...';
            orbWrapper.className = 'orb-wrapper speaking';
            orb.className = 'orb speaking';
        };
        u.onend = () => {
            console.log('🔊 speech ended');
            statusLabel.textContent = 'Tap to speak';
            orbWrapper.className = 'orb-wrapper idle';
            orb.className = 'orb idle';
        };
        u.onerror = (e) => {
            console.error('🔊 speech error:', e);
            statusLabel.textContent = 'Tap to speak';
            orbWrapper.className = 'orb-wrapper idle';
            orb.className = 'orb idle';
        };

        synth.speak(u);
    }

    // ---------- COMMAND ----------
    function doCommand(raw) {
        console.log('🎯 doCommand():', raw);
        const said = raw.toLowerCase();

        // YouTube
        if (said.includes('youtube')) {
            aiTextEl.textContent = 'Opening YouTube...';
            speak('Opening YouTube');
            setTimeout(() => {
                const w = window.open('https://youtube.com', '_blank');
                if (!w) window.location.href = 'https://youtube.com';
            }, 1200);
            return;
        }

        // Google
        if (said.includes('google')) {
            aiTextEl.textContent = 'Opening Google...';
            speak('Opening Google');
            setTimeout(() => {
                const w = window.open('https://google.com', '_blank');
                if (!w) window.location.href = 'https://google.com';
            }, 1200);
            return;
        }

        // GitHub
        if (said.includes('github')) {
            aiTextEl.textContent = 'Opening GitHub...';
            speak('Opening GitHub');
            setTimeout(() => {
                const w = window.open('https://github.com', '_blank');
                if (!w) window.location.href = 'https://github.com';
            }, 1200);
            return;
        }

        // Time
        if (said.includes('time')) {
            const t = new Date().toLocaleTimeString();
            aiTextEl.textContent = 'The time is ' + t;
            speak('The time is ' + t);
            return;
        }

        // Date
        if (said.includes('date') || said.includes('today')) {
            const d = new Date().toLocaleDateString('en-IN', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
            });
            aiTextEl.textContent = 'Today is ' + d;
            speak('Today is ' + d);
            return;
        }

        // Greeting
        if (said.includes('hello') || said.includes('hi') || said.includes('hey')) {
            aiTextEl.textContent = 'Hello! How can I help?';
            speak('Hello! How can I help?');
            return;
        }

        // Name
        if (said.includes('name') || said.includes('who are you')) {
            aiTextEl.textContent = 'I am your assistant.';
            speak('I am your assistant.');
            return;
        }

        // Thanks
        if (said.includes('thank')) {
            aiTextEl.textContent = 'You are welcome!';
            speak('You are welcome!');
            return;
        }

        // Stop
        if (said.includes('stop') || said.includes('quiet')) {
            synth.cancel();
            aiTextEl.textContent = 'Stopped.';
            statusLabel.textContent = 'Tap to speak';
            return;
        }

        // Fallback
        aiTextEl.textContent = "I don't know that command.";
        speak("Sorry, I don't know that command.");
    }

    // ---------- RECOGNITION ----------
    function startListening() {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) {
            alert('Use Google Chrome — your browser has no speech support.');
            return;
        }

        console.log('🎤 starting recognition');
        recognition = new SR();
        recognition.lang = 'en-US';
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            console.log('🎤 onstart');
            isListening = true;
            statusLabel.textContent = 'Listening...';
            orbWrapper.className = 'orb-wrapper listening';
            orb.className = 'orb listening';
            userTextEl.textContent = '';
            aiTextEl.textContent = '';
        };

        recognition.onresult = (event) => {
            const text = event.results[0][0].transcript;
            console.log('🎤 onresult:', text);
            userTextEl.textContent = 'You: "' + text + '"';
            statusLabel.textContent = 'Processing...';
            orbWrapper.className = 'orb-wrapper thinking';
            orb.className = 'orb thinking';

            // Run command IMMEDIATELY, synchronously
            doCommand(text);
        };

        recognition.onerror = (event) => {
            console.warn('🎤 onerror:', event.error);
            isListening = false;
            if (event.error === 'aborted' || event.error === 'no-speech') {
                statusLabel.textContent = 'Tap to speak';
                orbWrapper.className = 'orb-wrapper idle';
                orb.className = 'orb idle';
                return;
            }
            statusLabel.textContent = 'Mic error: ' + event.error;
            orbWrapper.className = 'orb-wrapper idle';
            orb.className = 'orb idle';
        };

        recognition.onend = () => {
            console.log('🎤 onend');
            isListening = false;
            // Only reset UI if we are NOT speaking
            if (!synth.speaking) {
                statusLabel.textContent = 'Tap to speak';
                orbWrapper.className = 'orb-wrapper idle';
                orb.className = 'orb idle';
            }
        };

        try {
            recognition.start();
        } catch (err) {
            console.error('🎤 start failed:', err);
        }
    }

    // ---------- ORB CLICK ----------
    orb.addEventListener('click', () => {
        console.log('👆 orb clicked. isListening =', isListening, 'synth.speaking =', synth.speaking);

        if (synth.speaking) {
            synth.cancel();
            statusLabel.textContent = 'Tap to speak';
            orbWrapper.className = 'orb-wrapper idle';
            orb.className = 'orb idle';
            return;
        }

        if (isListening && recognition) {
            try { recognition.abort(); } catch(e){}
            return;
        }

        startListening();
    });

    // Prime voices
    window.speechSynthesis.getVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    }

    statusLabel.textContent = 'Tap to speak';
    console.log('✅ Assistant ready');
});
