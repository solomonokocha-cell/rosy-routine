const hasRosyProfile = Boolean(localStorage.getItem('rosy-routine-profile'));
if (!hasRosyProfile) window.location.replace('auth.html');

const STORAGE_KEY = 'rosy-routine-state';
const SHARED_STATE_KEY = 'rosy-routine-shared-state';
const defaultState = { flowers: 0, points: 0, coins: 60, water: 5, fertilizer: 2, streak: 0, lastStudyDate: '', tasks: [], unlocked: [], xp: 0, sessions: 0, completedTasks: 0, studyDays: [], plants: [], seeds: 2, lastRewardDate: '', rewardStreak: 0, selectedSubject: 'Biology', selectedFlower: 'Rose', focusMinutes: 25, chatSessions: [] };
let state = { ...defaultState, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') };
  state.studyDays = Array.isArray(state.studyDays) ? state.studyDays : [];
  state.coins = Number.isFinite(state.coins) ? state.coins : Math.max(60, state.points || 0);
  state.water = Number.isFinite(state.water) ? state.water : 5;
  state.fertilizer = Number.isFinite(state.fertilizer) ? state.fertilizer : 2;
state.tasks = Array.isArray(state.tasks) ? state.tasks : [];
state.chatSessions = Array.isArray(state.chatSessions) ? state.chatSessions : [];
let selectedMinutes = Number(state.focusMinutes) || 25;
let remainingSeconds = selectedMinutes * 60;
let timerId = null;
let deferredInstallPrompt = null;

const $ = (id) => document.getElementById(id);
const save = () => {
  state.selectedSubject = ['Biology', 'Mathematics', 'English', 'Science', 'History', 'Geography', 'French', 'Igbo', 'Yoruba', 'Economics', 'Physics', 'Computer Science'].includes(state.selectedSubject) ? state.selectedSubject : 'Biology';
  state.selectedFlower = ['Rose', 'Tulip', 'Sunflower', 'Lily', 'Daisy', 'Orchid', 'Lavender', 'Peony'].includes(state.selectedFlower) ? state.selectedFlower : 'Rose';
  state.focusMinutes = [20, 25, 30, 40, 45, 60].includes(Number(state.focusMinutes)) ? Number(state.focusMinutes) : 25;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  localStorage.setItem(SHARED_STATE_KEY, JSON.stringify({ selectedSubject: state.selectedSubject, selectedFlower: state.selectedFlower, focusMinutes: state.focusMinutes, chatSessions: state.chatSessions || [] }));
};
window.addEventListener('storage', (event) => {
  if (event.key !== SHARED_STATE_KEY || !event.newValue) return;
  try {
    const shared = JSON.parse(event.newValue);
    state.selectedSubject = shared.selectedSubject || state.selectedSubject;
    state.selectedFlower = shared.selectedFlower || state.selectedFlower;
    state.focusMinutes = [20, 25, 30, 40, 45, 60].includes(Number(shared.focusMinutes)) ? Number(shared.focusMinutes) : state.focusMinutes;
    state.chatSessions = Array.isArray(shared.chatSessions) ? shared.chatSessions : state.chatSessions;
    selectedMinutes = Number(state.focusMinutes) || 25;
    remainingSeconds = selectedMinutes * 60;
    const currentSubject = document.getElementById('profileSubject');
    const currentFlower = document.getElementById('profileFlower');
    if (currentSubject) currentSubject.value = state.selectedSubject;
    if (currentFlower) currentFlower.value = state.selectedFlower;
    updateTimerDisplay();
  } catch (error) {
    console.warn('Shared state sync failed:', error);
  }
});
const todayKey = () => new Date().toISOString().slice(0, 10);
const showToast = (message) => { const toast = $('toast'); toast.textContent = message; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 2600); };

function render() {
  $('flowerCount').textContent = state.flowers;
  $('gardenCount').textContent = state.flowers;
  $('pointCount').textContent = state.points;
  $('shopPoints').textContent = state.points;
  $('streakCount').textContent = `${state.streak} day${state.streak === 1 ? '' : 's'}`;
  const level = Math.floor(state.xp / 100) + 1;
  $('levelNumber').textContent = `Gardener Level ${level}`;
  $('levelArtNumber').textContent = level;
  $('todayLabel').textContent = new Intl.DateTimeFormat('en', { weekday: 'long', month: 'short', day: 'numeric' }).format(new Date());
  renderGarden(); renderTasks(); updateShop(); updateProgress(); renderProgression();
}

function renderGarden() {
  $('gardenGrid').innerHTML = Array.from({ length: 12 }, (_, index) => `<div class="garden-slot ${index < state.flowers ? 'filled' : ''}" aria-label="${index < state.flowers ? 'Grown flower' : 'Empty garden plot'}">${index < state.flowers ? ['✿', '❀', '✽'][index % 3] : '+'}</div>`).join('');
}

function renderTasks() {
  const list = $('taskList');
  list.innerHTML = state.tasks.length ? state.tasks.map((task, index) => `<li><input type="checkbox" data-task-index="${index}" ${task.done ? 'checked' : ''} aria-label="Complete ${task.text}"><label class="${task.done ? 'done' : ''}">${escapeHtml(task.text)}</label></li>`).join('') : '<li class="helper-text">Your list is waiting for a gentle first step.</li>';
}

function updateProgress() {
  const milestones = [3, 6, 12];
  const next = milestones.find((milestone) => state.flowers < milestone);
  if (!next) { $('nextUnlock').textContent = 'Garden fully bloomed'; $('unlockProgress').style.width = '100%'; return; }
  const previous = milestones[milestones.indexOf(next) - 1] || 0;
  $('nextUnlock').textContent = `Grow ${next - state.flowers} more flower${next - state.flowers === 1 ? '' : 's'}`;
  $('unlockProgress').style.width = `${Math.min(100, ((state.flowers - previous) / (next - previous)) * 100)}%`;
}

function updateShop() { document.querySelectorAll('.shop-item').forEach((item) => { const itemName = item.dataset.item; item.disabled = state.unlocked.includes(itemName) || state.points < Number(item.dataset.cost); if (state.unlocked.includes(itemName)) item.querySelector('small').textContent = 'unlocked'; }); }
function escapeHtml(value) { return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character])); }
function updateTimerDisplay() { const minutes = Math.floor(remainingSeconds / 60).toString().padStart(2, '0'); const seconds = (remainingSeconds % 60).toString().padStart(2, '0'); $('timerDisplay').textContent = `${minutes}:${seconds}`; const progress = ((selectedMinutes * 60 - remainingSeconds) / (selectedMinutes * 60)) * 360; document.querySelector('.timer-ring').style.background = `conic-gradient(var(--rose) ${progress}deg, #f8e5ea ${progress}deg)`; }
function buildChatTitle(message) {
  const raw = String(message || '').trim();
  if (!raw) return 'New study check-in';
  const lower = raw.toLowerCase();
  if (/^(hi|hello|hey|greetings|good morning|good afternoon|good evening)/.test(lower)) return 'Greeting exchange';
  const words = raw.split(/\s+/).filter(Boolean).slice(0, 5).join(' ');
  return words.slice(0, 32) || 'Study check-in';
}
function saveChatSession(messages) {
  const firstUser = messages.find((entry) => entry.role === 'user')?.content || 'Study chat';
  const session = { id: Date.now().toString(36), title: buildChatTitle(firstUser), createdAt: new Date().toISOString(), messages };
  const sessions = Array.isArray(state.chatSessions) ? state.chatSessions : [];
  state.chatSessions = [session, ...sessions.filter((item) => item.id !== session.id)].slice(0, 8);
  save();
}

function getBadges() {
  return [
    { icon: '✿', name: 'First Bloom', detail: 'Complete your first session', earned: state.sessions >= 1 },
    { icon: '✦', name: 'Three in a Row', detail: 'Reach a 3-day streak', earned: state.streak >= 3 },
    { icon: '◌', name: 'Deep Work', detail: 'Complete 5 sessions', earned: state.sessions >= 5 },
    { icon: '❀', name: 'Garden Keeper', detail: 'Grow 10 flowers', earned: state.flowers >= 10 },
    { icon: '✓', name: 'Task Tamer', detail: 'Complete 5 study tasks', earned: state.completedTasks >= 5 },
    { icon: '💧', name: 'Gentle Gardener', detail: 'Care for 5 plants', earned: state.plants.reduce((total, plant) => total + Number(plant.careCount || 0), 0) >= 5 },
    { icon: '☀', name: 'Full Bloom', detail: 'Reach a 7-day streak', earned: state.streak >= 7 }
  ];
}

function renderProgression() {
  const level = Math.floor(state.xp / 100) + 1;
  const withinLevel = state.xp % 100;
  $('streakHeroCount').textContent = state.streak;
  $('levelNumber').textContent = `Gardener Level ${level}`;
  $('levelArtNumber').textContent = level;
  $('xpLabel').textContent = `${state.xp} XP`;
  $('levelCurrent').textContent = `${withinLevel} XP`;
  $('levelNext').textContent = `${100 - withinLevel} XP to Level ${level + 1}`;
  $('levelProgress').style.width = `${withinLevel}%`;
  $('streakMessage').textContent = state.streak ? (state.streak >= 3 ? 'You are building a beautiful rhythm.' : 'One more day will make this streak glow.') : 'Start today to light your first day.';
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  $('streakWeek').innerHTML = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today); date.setDate(today.getDate() - (6 - index));
    const key = date.toISOString().slice(0, 10);
    const isToday = index === 6;
    return `<div class="day-dot ${state.studyDays.includes(key) ? 'complete' : ''} ${isToday ? 'today' : ''}"><span>${dayNames[date.getDay()]}</span><i>${state.studyDays.includes(key) ? '✓' : '·'}</i></div>`;
  }).join('');
  const badges = getBadges();
  $('badgeCount').textContent = `${badges.filter((badge) => badge.earned).length} / ${badges.length} badges`;
  $('badgeGrid').innerHTML = badges.map((badge) => `<article class="badge-tile ${badge.earned ? 'earned' : 'locked'}"><span class="badge-icon">${badge.icon}</span><div><strong>${badge.name}</strong><small>${badge.detail}</small></div><b>${badge.earned ? 'Earned' : 'Locked'}</b></article>`).join('');
}

function completeStudy() {
  state.flowers = Math.min(12, state.flowers + 1); state.points += 25; state.coins += 25; state.water += 2; state.fertilizer += 1; state.xp += 25; state.sessions += 1;
  const today = todayKey();
  if (!state.studyDays.includes(today)) state.studyDays.push(today);
  if (state.lastStudyDate !== today) { const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1); state.streak = state.lastStudyDate === yesterday.toISOString().slice(0, 10) ? state.streak + 1 : 1; state.lastStudyDate = today; }
  save(); render(); showToast('A new flower joined your garden! +25 pts · +2 water'); showCelebration();
}
function resetTimer() { clearInterval(timerId); timerId = null; remainingSeconds = selectedMinutes * 60; $('timerButton').textContent = 'Start timer'; $('timerState').textContent = 'Ready'; $('timerCaption').textContent = 'deep focus'; updateTimerDisplay(); }
function toggleTimer() {
  if (timerId) { clearInterval(timerId); timerId = null; $('timerButton').textContent = 'Resume timer'; $('timerState').textContent = 'Paused'; return; }
  if (document.fullscreenEnabled && !document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  }
  $('timerState').textContent = 'Growing'; $('timerCaption').textContent = 'stay with it'; $('timerButton').textContent = 'Pause timer';
  state.focusMinutes = selectedMinutes;
  save();
  timerId = setInterval(() => {
    remainingSeconds -= 1;
    updateTimerDisplay();
    if (document.hidden || (document.fullscreenEnabled && document.fullscreenElement === null && timerId)) {
      clearInterval(timerId);
      timerId = null;
      resetTimer();
      state.focusMinutes = selectedMinutes;
      save();
      showToast('Focus room restarted after leaving the screen.');
      toggleTimer();
      return;
    }
    if (remainingSeconds <= 0) { resetTimer(); completeStudy(); }
  }, 1000);
}

$('timerButton').addEventListener('click', toggleTimer); $('resetButton').addEventListener('click', resetTimer); $('startHeroButton').addEventListener('click', () => { $('timer').scrollIntoView({ behavior: 'smooth' }); if (!timerId) toggleTimer(); });
document.querySelectorAll('.duration-chip').forEach((chip) => chip.addEventListener('click', () => { if (timerId) return; document.querySelector('.duration-chip.active').classList.remove('active'); chip.classList.add('active'); selectedMinutes = Number(chip.dataset.minutes); state.focusMinutes = selectedMinutes; save(); resetTimer(); }));
const profileSubject = document.getElementById('profileSubject');
const profileFlower = document.getElementById('profileFlower');
if (profileSubject) {
  profileSubject.value = state.selectedSubject || 'Biology';
  profileSubject.addEventListener('change', (event) => { state.selectedSubject = event.target.value; save(); });
}
if (profileFlower) {
  profileFlower.value = state.selectedFlower || 'Rose';
  profileFlower.addEventListener('change', (event) => { state.selectedFlower = event.target.value; save(); showToast(`${event.target.value} selected for your next bloom.`); });
}
document.addEventListener('fullscreenchange', () => {
  if (timerId && !document.fullscreenElement) {
    clearInterval(timerId);
    timerId = null;
    resetTimer();
    state.focusMinutes = selectedMinutes;
    save();
    showToast('Focus room restarted in fullscreen.');
    toggleTimer();
  }
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden && timerId) {
    clearInterval(timerId);
    timerId = null;
    resetTimer();
    state.focusMinutes = selectedMinutes;
    save();
    showToast('You left the room, so the timer restarted.');
    toggleTimer();
  }
});
$('taskForm').addEventListener('submit', (event) => { event.preventDefault(); const input = $('taskInput'); const text = input.value.trim(); if (!text) return; state.tasks.push({ text, done: false }); input.value = ''; save(); renderTasks(); });
$('taskList').addEventListener('change', (event) => { const index = event.target.dataset.taskIndex; if (index === undefined) return; const wasDone = state.tasks[index].done; state.tasks[index].done = event.target.checked; if (!wasDone && event.target.checked) state.completedTasks += 1; save(); renderTasks(); renderProgression(); });
$('clearTasks').addEventListener('click', () => { state.tasks = state.tasks.filter((task) => !task.done); save(); renderTasks(); });
document.querySelectorAll('.shop-item').forEach((item) => item.addEventListener('click', () => { const cost = Number(item.dataset.cost); const name = item.dataset.item; if (state.points < cost || state.unlocked.includes(name)) return; state.points -= cost; state.unlocked.push(name); save(); render(); showToast(`${name} unlocked for your garden`); }));
window.addEventListener('beforeinstallprompt', (event) => { event.preventDefault(); deferredInstallPrompt = event; $('installButton').classList.remove('hidden'); });
$('installButton').addEventListener('click', async () => { if (!deferredInstallPrompt) { showToast('Use your browser menu to install Rosy Routine.'); return; } deferredInstallPrompt.prompt(); await deferredInstallPrompt.userChoice; deferredInstallPrompt = null; $('installButton').classList.add('hidden'); });
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('sw.js'));
const chatHistory = [];
const CHAT_ENDPOINT = window.ROSY_CHAT_ENDPOINT || `${location.protocol}//${location.hostname}:5001/api/study-chat`;

function setView(view) {
  document.querySelectorAll('.view-panel').forEach((panel) => panel.classList.toggle('is-hidden', !panel.classList.contains(`view-${view}`)));
  document.querySelectorAll('.view-container').forEach((container) => container.classList.toggle('is-hidden', !container.querySelector(`.view-${view}`)));
  document.querySelectorAll('.nav-tab').forEach((tab) => tab.classList.toggle('active', tab.dataset.view === view));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.querySelectorAll('.nav-tab').forEach((tab) => tab.addEventListener('click', () => setView(tab.dataset.view)));
const savedNotes = localStorage.getItem('rosy-routine-notes') || '';
$('studyNotes').value = savedNotes;
$('saveNotes').addEventListener('click', () => { localStorage.setItem('rosy-routine-notes', $('studyNotes').value.trim()); showToast('Your learning notes are saved on this device.'); });

function addChatMessage(role, message) {
  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${role}`;
  bubble.innerHTML = `<strong>${role === 'bot' ? 'Rosy' : 'You'}</strong><p>${escapeHtml(message)}</p>`;
  $('chatMessages').appendChild(bubble);
  $('chatMessages').scrollTop = $('chatMessages').scrollHeight;
}

async function askRosy(message) {
  const cleanMessage = message.trim();
  if (!cleanMessage) return;
  addChatMessage('user', cleanMessage);
  $('chatInput').disabled = true;
  const typing = document.createElement('div');
  typing.className = 'chat-bubble bot typing';
  typing.textContent = 'Rosy is thinking...';
  $('chatMessages').appendChild(typing);
  try {
    const response = await fetch(CHAT_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: cleanMessage, history: chatHistory.slice(-8), notes: $('studyNotes').value.trim() }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.reply || 'The study buddy is unavailable.');
    typing.remove(); addChatMessage('bot', data.reply || 'I could not find an answer yet.');
    chatHistory.push({ role: 'user', content: cleanMessage }, { role: 'assistant', content: data.reply || '' });
    saveChatSession(chatHistory.slice(-10));
  } catch (error) {
    typing.remove(); addChatMessage('bot', 'I could not reach Gemini. Start the local AI server and check that GEMINI_API_KEY is configured.');
    console.error('Study Buddy error:', error);
  } finally { $('chatInput').disabled = false; $('chatInput').focus(); }
}

$('chatForm').addEventListener('submit', (event) => { event.preventDefault(); const input = $('chatInput'); const message = input.value.trim(); input.value = ''; askRosy(message); });
document.querySelectorAll('.quick-prompts button').forEach((button) => button.addEventListener('click', () => askRosy(button.dataset.prompt)));
setView('dashboard');
updateTimerDisplay(); render();

function showCelebration() { $('celebration').hidden = false; requestAnimationFrame(() => $('celebration').classList.add('visible')); }
function closeCelebration() { $('celebration').classList.remove('visible'); setTimeout(() => { $('celebration').hidden = true; }, 220); }
$('closeCelebration').addEventListener('click', closeCelebration);
$('celebrationButton').addEventListener('click', closeCelebration);