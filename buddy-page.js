const buddyHistory = [];
const buddyNotes = document.getElementById('studyNotes');
const buddyEndpoint = window.ROSY_CHAT_ENDPOINT || `${location.protocol}//${location.hostname}:5001/api/study-chat`;
const chatMessages = document.getElementById('chatMessages');
const chatForm = document.getElementById('chatForm');
const savedChats = document.getElementById('savedChats');
const chatInput = document.getElementById('chatInput');
const buddyStatus = document.getElementById('buddyStatus');
const actionButtons = document.querySelectorAll('.ai-tool');

buddyNotes.value = localStorage.getItem('rosy-routine-notes') || '';

const actionPrompts = {
  explain: 'Explain the topic in my notes simply, using a beginner-friendly analogy and one short example. End with one question to check my understanding.',
  quiz: 'Create a gentle five-question quiz from my notes. Ask one question at a time, wait for my answer, and give a short explanation after each answer.',
  plan: 'Create a realistic 30-minute study plan from my notes. Include one focus block, one active-recall activity, and a short break.',
  summarize: 'Summarize my notes into five essential points, then list any terms or ideas I should review next.',
  flashcards: 'Turn my notes into eight useful flashcards. Format each as Question: and Answer: so I can practise active recall.'
};

function escapeBuddyHtml(message) {
  return message.replace(/[&<>]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[character]));
}

function buildChatTitle(message) {
  const raw = String(message || '').trim();
  if (!raw) return 'New study check-in';
  const lower = raw.toLowerCase();
  if (/^(hi|hello|hey|greetings|good morning|good afternoon|good evening)/.test(lower)) return 'Greeting exchange';
  const words = raw.split(/\s+/).filter(Boolean).slice(0, 5).join(' ');
  return words.slice(0, 32) || 'Study check-in';
}

function saveBuddyChat(messages) {
  const entries = Array.isArray(JSON.parse(localStorage.getItem('rosy-routine-chat-sessions') || '[]')) ? JSON.parse(localStorage.getItem('rosy-routine-chat-sessions') || '[]') : [];
  const firstUser = messages.find((entry) => entry.role === 'user')?.content || 'Study chat';
  const session = { id: Date.now().toString(36), title: buildChatTitle(firstUser), createdAt: new Date().toISOString(), messages };
  const nextEntries = [session, ...entries.filter((item) => item.id !== session.id)].slice(0, 8);
  localStorage.setItem('rosy-routine-chat-sessions', JSON.stringify(nextEntries));
  if (savedChats) {
    savedChats.innerHTML = nextEntries.map((entry) => `<li><strong>${escapeBuddyHtml(entry.title)}</strong><small>${new Date(entry.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</small></li>`).join('');
  }
}

function appendBuddy(role, message) {
  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${role}`;
  bubble.innerHTML = `<strong>${role === 'bot' ? 'Rosy' : 'You'}</strong><p>${escapeBuddyHtml(message)}</p>`;
  chatMessages.appendChild(bubble);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function setBusy(isBusy) {
  chatInput.disabled = isBusy;
  chatForm.querySelector('button').disabled = isBusy;
  actionButtons.forEach((button) => { button.disabled = isBusy; });
}

async function askRosy(message) {
  const cleanMessage = message.trim();
  if (!cleanMessage) return;
  appendBuddy('user', cleanMessage);
  setBusy(true);
  buddyStatus.classList.remove('error');
  buddyStatus.textContent = 'Rosy is thinking...';
  const typing = document.createElement('div');
  typing.className = 'chat-bubble bot typing';
  typing.textContent = 'Rosy is thinking...';
  chatMessages.appendChild(typing);
  try {
    const response = await fetch(buddyEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: cleanMessage, notes: buddyNotes.value.trim(), history: buddyHistory.slice(-8) })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.reply || 'The study buddy is unavailable.');
    typing.remove();
    appendBuddy('bot', data.reply || 'I could not find an answer yet.');
    buddyHistory.push({ role: 'user', content: cleanMessage }, { role: 'assistant', content: data.reply || '' });
    saveBuddyChat(buddyHistory.slice(-10));
    buddyStatus.textContent = 'Ready for your next question.';
  } catch (error) {
    typing.remove();
    appendBuddy('bot', 'I could not reach the study AI. Check that the local AI server is running and GEMINI_API_KEY is configured. Your notes are still safe on this device.');
    buddyStatus.classList.add('error');
    buddyStatus.textContent = 'The study AI is offline.';
    console.error('Study Buddy error:', error);
  } finally {
    setBusy(false);
    chatInput.focus();
  }
}

document.getElementById('saveNotes').addEventListener('click', () => {
  localStorage.setItem('rosy-routine-notes', buddyNotes.value.trim());
  showRosyToast('Your learning notes are saved on this device.');
});

chatForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const message = chatInput.value;
  chatInput.value = '';
  askRosy(message);
});

actionButtons.forEach((button) => button.addEventListener('click', () => {
  actionButtons.forEach((item) => item.classList.toggle('active', item === button));
  const notes = buddyNotes.value.trim();
  const actionPrompt = actionPrompts[button.dataset.action];
  if (!notes) {
    chatInput.focus();
    buddyStatus.textContent = 'Add a few notes first so Rosy can make this useful.';
    return;
  }
  askRosy(actionPrompt);
}));
