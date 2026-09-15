console.log('🚀 script.js loaded');

window.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 DOM ready');

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

  function uiSet(state) {
    orbWrapper.className = 'orb-wrapper ' + state;
    orb.className = 'orb ' + state;
    if (state === 'idle')      statusLabel.textContent = 'Tap to speak';
    if (state === 'listening') statusLabel.textContent = 'Listening...';
    if (state === 'thinking')  statusLabel.textContent = 'Processing...';
    if (state === 'speaking')  statusLabel.textContent = 'Speaking...';
  }

  function speak(text) {
    console.log('🔊 speak:', text);
    try {
      synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US';
      u.onstart = () => { console.log('🔊 start'); uiSet('speaking'); };
      u.onend   = () => { console.log('🔊 end');   uiSet('idle'); };
      u.onerror = (e) => { console.error('🔊 err', e); uiSet('idle'); };
      synth.speak(u);
    } catch (e) {
      console.error('🔊 exception', e);
      uiSet('idle');
    }
  }

  function doCommand(raw) {
    console.log('🎯 doCommand:', raw);
    const said = ' ' + raw.toLowerCase() + ' ';

    if (said.includes('youtube')) {
      aiTextEl.textContent = 'Opening YouTube...';
      speak('Opening YouTube');
      setTimeout(() => { window.location.href = 'https://youtube.com'; }, 1200);
      return;
    }
    if (said.includes('google')) {
      aiTextEl.textContent = 'Opening Google...';
      speak('Opening Google');
      setTimeout(() => { window.location.href = 'https://google.com'; }, 1200);
      return;
    }
    if (said.includes('github')) {
      aiTextEl.textContent = 'Opening GitHub...';
      speak('Opening GitHub');
      setTimeout(() => { window.location.href = 'https://github.com'; }, 1200);
      return;
    }
    if (said.includes('time')) {
      const t = new Date().toLocaleTimeString();
      aiTextEl.textContent = 'The time is ' + t;
      speak('The time is ' + t);
      return;
    }
    if (said.includes('date') || said.includes('today')) {
      const d = new Date().toDateString();
      aiTextEl.textContent = 'Today is ' + d;
      speak('Today is ' + d);
      return;
    }
    if (said.includes('hello') || said.includes(' hi ') || said.includes('hey')) {
      aiTextEl.textContent = 'Hello! How can I help?';
      speak('Hello! How can I help?');
      return;
    }
    if (said.includes('name') || said.includes('who are you')) {
      aiTextEl.textContent = 'I am your assistant.';
      speak('I am your assistant.');
      return;
    }
    if (said.includes('thank')) {
      aiTextEl.textContent = 'You are welcome!';
      speak('You are welcome!');
      return;
    }
    if (said.includes('stop') || said.includes('quiet')) {
      synth.cancel(); uiSet('idle');
      aiTextEl.textContent = 'Stopped.';
      return;
    }

    aiTextEl.textContent = "I don't know that command.";
    speak("Sorry, I don't know that command.");
  }

  function startListening() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert('Use Chrome — speech not supported'); return; }

    console.log('🎤 creating recognition');
    recognition = new SR();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

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

  if (orb) {
    orb.addEventListener('click', () => {
      console.log('👆 orb tapped. listening=' + isListening + ' speaking=' + synth.speaking);
      if (synth.speaking) { synth.cancel(); uiSet('idle'); return; }
      if (isListening) { try { recognition.abort(); } catch(e){} return; }
      startListening();
    });
  }

  function submitText() {
    const v = textInput.value.trim();
    if (!v) return;
    console.log('⌨️ typed:', v);
    userTextEl.textContent = 'You: "' + v + '"';
    doCommand(v);
    textInput.value = '';
  }
  if (sendBtn) sendBtn.addEventListener('click', submitText);
  if (textInput) textInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') submitText(); });

  window.speechSynthesis.getVoices();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
  }

  uiSet('idle');
  console.log('✅ Ready');
});
