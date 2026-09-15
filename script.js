// ============================================================
// Kaira AI — Voice Assistant (No API, All Apps)
// ============================================================
console.log('🚀 Kaira AI script loaded');

window.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 DOM ready');

  // ---------- ELEMENTS ----------
  const orb         = document.getElementById('orb');
  const orbWrapper  = document.getElementById('orb-wrapper');
  const statusLabel = document.getElementById('status');
  const userTextEl  = document.getElementById('user-text');
  const aiTextEl    = document.getElementById('ai-text');
  const textInput   = document.getElementById('text-input');
  const sendBtn     = document.getElementById('send-btn');

  console.log('🔍 Elements:', {
    orb: !!orb, wrapper: !!orbWrapper, status: !!statusLabel,
    userText: !!userTextEl, aiText: !!aiTextEl,
    input: !!textInput, send: !!sendBtn
  });

  const synth = window.speechSynthesis;
  let recognition = null;
  let isListening = false;

  // ---------- UI STATE ----------
  function uiSet(state) {
    orbWrapper.className = 'orb-wrapper ' + state;
    orb.className = 'orb ' + state;
    if (state === 'idle')      statusLabel.textContent = 'Tap to speak';
    if (state === 'listening') statusLabel.textContent = 'Listening...';
    if (state === 'thinking')  statusLabel.textContent = 'Processing...';
    if (state === 'speaking')  statusLabel.textContent = 'Speaking...';
  }

  // ---------- SPEAK ----------
  function speak(text) {
    console.log('🔊 speak:', text);
    try {
      synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-IN';
      u.rate = 1;
      u.pitch = 1.05;
      u.volume = 1;

      u.onstart = () => { console.log('🔊 start'); uiSet('speaking'); };
      u.onend   = () => { console.log('🔊 end');   uiSet('idle'); };
      u.onerror = (e) => { console.error('🔊 err', e); uiSet('idle'); };

      synth.speak(u);
    } catch (e) {
      console.error('🔊 exception', e);
      uiSet('idle');
    }
  }

  // ---------- SMART APP OPENER ----------
  function openApp(scheme, webUrl, name) {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    aiTextEl.textContent = 'Opening ' + name + '...';
    speak('Opening ' + name);

    if (isMobile && scheme && !scheme.startsWith('http')) {
      // Try to launch native app via deep link
      const start = Date.now();
      try { window.location.href = scheme; } catch(e){}

      // Fallback: if app not installed, go to website
      setTimeout(() => {
        if (Date.now() - start < 1800 && !document.hidden) {
          window.location.href = webUrl;
        }
      }, 1400);
    } else {
      // Desktop or web-only: open website
      setTimeout(() => { window.location.href = webUrl; }, 1200);
    }
  }

  // ---------- COMMAND HANDLER ----------
  function doCommand(raw) {
    console.log('🎯 doCommand:', raw);
    const said = ' ' + raw.toLowerCase().trim() + ' ';

    // ============================================
    // APPS & WEBSITES
    // ============================================
    const APPS = [
      { kw: ['whatsapp business'],   scheme: 'whatsapp://',              web: 'https://web.whatsapp.com',             name: 'WhatsApp Business' },
      { kw: ['whatsapp'],            scheme: 'whatsapp://',              web: 'https://web.whatsapp.com',             name: 'WhatsApp' },
      { kw: ['instagram', 'insta'],  scheme: 'instagram://app',          web: 'https://instagram.com',                name: 'Instagram' },
      { kw: ['facebook', ' fb '],    scheme: 'fb://',                    web: 'https://facebook.com',                 name: 'Facebook' },
      { kw: ['telegram'],            scheme: 'tg://',                    web: 'https://web.telegram.org',             name: 'Telegram' },
      { kw: ['snapchat', 'snap'],    scheme: 'snapchat://',              web: 'https://web.snapchat.com',             name: 'Snapchat' },
      { kw: ['youtube music'],       scheme: 'youtubemusic://',          web: 'https://music.youtube.com',            name: 'YouTube Music' },
      { kw: ['youtube'],             scheme: 'vnd.youtube://',           web: 'https://youtube.com',                  name: 'YouTube' },
      { kw: ['gmail', 'email'],      scheme: 'googlegmail://',           web: 'https://mail.google.com',              name: 'Gmail' },
      { kw: ['google drive', 'drive'], scheme: 'googledrive://',         web: 'https://drive.google.com',             name: 'Google Drive' },
      { kw: ['google photos', 'photos'], scheme: 'googlephotos://',      web: 'https://photos.google.com',            name: 'Google Photos' },
      { kw: ['google maps', 'maps', 'map'], scheme: 'geo://',            web: 'https://maps.google.com',              name: 'Google Maps' },
      { kw: ['google pay', 'gpay'],  scheme: 'tez://',                   web: 'https://pay.google.com',               name: 'Google Pay' },
      { kw: ['google'],              scheme: 'https://google.com',       web: 'https://google.com',                   name: 'Google' },
      { kw: ['github'],              scheme: 'https://github.com',       web: 'https://github.com',                   name: 'GitHub' },
      { kw: ['twitter', ' x.com'],   scheme: 'twitter://',               web: 'https://twitter.com',                  name: 'Twitter' },
      { kw: ['linkedin'],            scheme: 'linkedin://',              web: 'https://linkedin.com',                 name: 'LinkedIn' },
      { kw: ['spotify'],             scheme: 'spotify://',               web: 'https://open.spotify.com',             name: 'Spotify' },
      { kw: ['netflix'],             scheme: 'nflx://',                  web: 'https://netflix.com',                  name: 'Netflix' },
      { kw: ['amazon'],              scheme: 'https://amazon.in',        web: 'https://amazon.in',                    name: 'Amazon' },
      { kw: ['flipkart'],            scheme: 'https://flipkart.com',      web: 'https://flipkart.com',                 name: 'Flipkart' },
      { kw: ['paytm'],               scheme: 'paytmmp://',               web: 'https://paytm.com',                    name: 'Paytm' },
      { kw: ['phonepe', 'phone pe'], scheme: 'phonepe://',               web: 'https://phonepe.com',                  name: 'PhonePe' },
      { kw: ['uber'],                scheme: 'uber://',                  web: 'https://m.uber.com',                   name: 'Uber' },
      { kw: ['ola'],                 scheme: 'ola://',                   web: 'https://olacabs.com',                  name: 'Ola' },
      { kw: ['zomato'],              scheme: 'zomato://',                web: 'https://zomato.com',                   name: 'Zomato' },
      { kw: ['swiggy'],              scheme: 'swiggy://',                web: 'https://swiggy.com',                   name: 'Swiggy' },
      { kw: ['chatgpt', 'chat gpt'], scheme: 'https://chat.openai.com',  web: 'https://chat.openai.com',              name: 'ChatGPT' },
      { kw: ['calendar'],            scheme: 'https://calendar.google.com', web: 'https://calendar.google.com',       name: 'Calendar' },
      { kw: ['reddit'],              scheme: 'reddit://',                web: 'https://reddit.com',                   name: 'Reddit' },
      { kw: ['pinterest'],           scheme: 'pinterest://',             web: 'https://pinterest.com',                name: 'Pinterest' },
      { kw: ['discord'],             scheme: 'discord://',               web: 'https://discord.com/app',              name: 'Discord' },
      { kw: ['zoom'],                scheme: 'zoommtg://',               web: 'https://zoom.us',                      name: 'Zoom' },
      { kw: ['meet', 'google meet'], scheme: 'https://meet.google.com',  web: 'https://meet.google.com',              name: 'Google Meet' }
    ];

    for (const app of APPS) {
      for (const k of app.kw) {
        if (said.includes(k)) {
          openApp(app.scheme, app.web, app.name);
          return;
        }
      }
    }

    // ============================================
    // CALL A NUMBER
    // ============================================
    if (said.includes('call')) {
      const numMatch = raw.match(/(\d{6,})/);
      if (numMatch) {
        const num = numMatch[1];
        aiTextEl.textContent = 'Calling ' + num + '...';
        speak('Calling ' + num);
        setTimeout(() => { window.location.href = 'tel:' + num; }, 1200);
        return;
      }
      aiTextEl.textContent = 'Opening dialer...';
      speak('Opening phone dialer');
      setTimeout(() => { window.location.href = 'tel:'; }, 1200);
      return;
    }

    // ============================================
    // SMS
    // ============================================
    if (said.includes('message') || said.includes('sms') || said.includes('text ')) {
      const numMatch = raw.match(/(\d{6,})/);
      if (numMatch) {
        aiTextEl.textContent = 'Opening messages...';
        speak('Opening messages');
        setTimeout(() => { window.location.href = 'sms:' + numMatch[1]; }, 1200);
        return;
      }
      aiTextEl.textContent = 'Opening messages...';
      speak('Opening messages');
      setTimeout(() => { window.location.href = 'sms:'; }, 1200);
      return;
    }

    // ============================================
    // CAMERA / PHOTO
    // ============================================
    if (said.includes('camera') || said.includes('take photo') || said.includes('photo')) {
      aiTextEl.textContent = 'Opening camera...';
      speak('Opening camera');
      // On mobile, try native camera app
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      if (isMobile) {
        setTimeout(() => { window.location.href = 'camera://'; }, 1200);
      } else {
        setTimeout(() => { window.location.href = 'https://webcamtests.com/'; }, 1200);
      }
      return;
    }

    // ============================================
    // COMPOSE EMAIL
    // ============================================
    if (said.includes('send email') || said.includes('compose email') || said.includes('new email')) {
      aiTextEl.textContent = 'Opening email...';
      speak('Opening email');
      setTimeout(() => { window.location.href = 'mailto:'; }, 1200);
      return;
    }

    // ============================================
    // TIME
    // ============================================
    if (said.includes('time')) {
      const t = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      aiTextEl.textContent = 'The time is ' + t;
      speak('The time is ' + t);
      return;
    }

    // ============================================
    // DATE
    // ============================================
    if (said.includes('date') || said.includes('today')) {
      const d = new Date().toLocaleDateString('en-IN', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
      });
      aiTextEl.textContent = 'Today is ' + d;
      speak('Today is ' + d);
      return;
    }

    // ============================================
    // SEARCH
    // ============================================
    if (said.includes('search for') || said.includes('search karo')) {
      const q = raw.replace(/.*(search for|search karo)/i, '').trim();
      if (!q) { aiTextEl.textContent = 'What should I search?'; speak('What should I search?'); return; }
      aiTextEl.textContent = 'Searching for ' + q;
      speak('Searching for ' + q);
      setTimeout(() => { window.location.href = 'https://www.google.com/search?q=' + encodeURIComponent(q); }, 1200);
      return;
    }

    // ============================================
    // PLAY ON YOUTUBE
    // ============================================
    if (said.includes('play') && said.includes('youtube')) {
      const q = raw.replace(/.*play/i, '').replace(/on youtube/i, '').trim() || 'music';
      aiTextEl.textContent = 'Playing ' + q + ' on YouTube';
      speak('Playing ' + q + ' on YouTube');
      setTimeout(() => { window.location.href = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q); }, 1200);
      return;
    }

    // ============================================
    // GREETINGS
    // ============================================
    if (said.includes('hello') || said.includes(' hi ') || said.includes('hey') || said.includes('namaste')) {
      const msg = 'Hello! I am Kaira AI. How can I help you?';
      aiTextEl.textContent = msg;
      speak(msg);
      return;
    }

    if (said.includes('good morning')) {
      aiTextEl.textContent = 'Good morning! Have a great day.';
      speak('Good morning! Have a great day.');
      return;
    }

    if (said.includes('good night')) {
      aiTextEl.textContent = 'Good night! Sweet dreams.';
      speak('Good night! Sweet dreams.');
      return;
    }

    if (said.includes('how are you')) {
      aiTextEl.textContent = "I'm doing great, thank you!";
      speak("I'm doing great, thank you!");
      return;
    }

    if (said.includes('name') || said.includes('who are you') || said.includes('kaun ho')) {
      const msg = 'I am Kaira AI, your personal assistant.';
      aiTextEl.textContent = msg;
      speak(msg);
      return;
    }

    if (said.includes('thank')) {
      aiTextEl.textContent = 'You are welcome!';
      speak('You are welcome!');
      return;
    }

    if (said.includes('bye') || said.includes('goodbye')) {
      aiTextEl.textContent = 'Goodbye! See you soon.';
      speak('Goodbye! See you soon.');
      return;
    }

    if (said.includes('stop') || said.includes('quiet') || said.includes('chup')) {
      synth.cancel();
      uiSet('idle');
      aiTextEl.textContent = 'Stopped.';
      return;
    }

    if (said.includes('joke')) {
      const jokes = [
        'Why did the developer go broke? Because he used up all his cache.',
        'Why do programmers prefer dark mode? Because light attracts bugs.',
        'I would tell you a UDP joke, but you might not get it.'
      ];
      const j = jokes[Math.floor(Math.random() * jokes.length)];
      aiTextEl.textContent = j;
      speak(j);
      return;
    }

    // ============================================
    // FALLBACK
    // ============================================
    aiTextEl.textContent = "Sorry, I don't know that command yet.";
    speak("Sorry, I am Kaira AI and I don't know that command yet.");
  }

  // ---------- SPEECH RECOGNITION ----------
  function startListening() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      statusLabel.textContent = 'Use Chrome — speech not supported';
      return;
    }

    console.log('🎤 creating recognition');
    recognition = new SR();
    recognition.lang = 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log('🎤 onstart');
      isListening = true;
      uiSet('listening');
      userTextEl.textContent = '';
      aiTextEl.textContent = '';
    };

    recognition.onresult = (e) => {
      const t = e.results[0][0].transcript;
      console.log('🎤 onresult:', t);
      userTextEl.textContent = 'You: "' + t + '"';
      uiSet('thinking');
      doCommand(t);
    };

    recognition.onerror = (e) => {
      console.warn('🎤 onerror:', e.error);
      isListening = false;
      if (e.error === 'aborted' || e.error === 'no-speech') { uiSet('idle'); return; }
      statusLabel.textContent = 'Mic: ' + e.error;
      uiSet('idle');
    };

    recognition.onend = () => {
      console.log('🎤 onend');
      isListening = false;
      if (!synth.speaking) uiSet('idle');
    };

    try { recognition.start(); }
    catch (e) { console.error('🎤 start err', e); }
  }

  // ---------- ORB CLICK ----------
  if (orb) {
    orb.addEventListener('click', () => {
      console.log('👆 orb tapped. listening=' + isListening + ' speaking=' + synth.speaking);
      if (synth.speaking) { synth.cancel(); uiSet('idle'); return; }
      if (isListening && recognition) { try { recognition.abort(); } catch(e){} return; }
      startListening();
    });
  }

  // ---------- TEXT INPUT ----------
  function submitText() {
    const v = textInput.value.trim();
    if (!v) return;
    console.log('⌨️ typed:', v);
    userTextEl.textContent = 'You: "' + v + '"';
    doCommand(v);
    textInput.value = '';
  }
  if (sendBtn)   sendBtn.addEventListener('click', submitText);
  if (textInput) textInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') submitText(); });

  // ---------- QUICK CHIPS ----------
  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const cmd = chip.getAttribute('data-cmd');
      console.log('🔘 chip:', cmd);
      userTextEl.textContent = 'You: "' + cmd + '"';
      doCommand(cmd);
    });
  });

  // ---------- PRIME VOICES ----------
  synth.getVoices();
  if (synth.onvoiceschanged !== undefined) {
    synth.onvoiceschanged = () => synth.getVoices();
  }

  // ---------- BOOT ----------
  uiSet('idle');
  console.log('✅ Kaira AI ready');
});
