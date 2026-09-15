    // ---------- TEXT INPUT FALLBACK ----------
    const textInput = document.getElementById('text-input');
    const sendBtn   = document.getElementById('send-btn');

    function submitText() {
        const val = textInput.value.trim();
        if (!val) return;
        console.log('⌨️ text command:', val);
        userTextEl.textContent = 'You: "' + val + '"';
        doCommand(val);
        textInput.value = '';
    }

    if (sendBtn) sendBtn.addEventListener('click', submitText);
    if (textInput) textInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') submitText();
    });
