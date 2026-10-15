const currentFile = location.pathname.split('/').pop() || 'index.html';
const hasRosyProfile = Boolean(localStorage.getItem('rosy-routine-profile'));
const publicFiles = new Set(['auth.html', 'about.html', 'journey.html']);
if (!hasRosyProfile && !publicFiles.has(currentFile)) window.location.replace('auth.html');

const sharedStyles = document.createElement('link');
sharedStyles.rel = 'stylesheet';
sharedStyles.href = 'multi-page.css';
document.head.appendChild(sharedStyles);
const growthStyles = document.createElement('link');
growthStyles.rel = 'stylesheet';
growthStyles.href = 'growth.css';
document.head.appendChild(growthStyles);
const noLogoStyles = document.createElement('link');
noLogoStyles.rel = 'stylesheet';
noLogoStyles.href = 'no-logo.css';
document.head.appendChild(noLogoStyles);
const gardenEffects = document.createElement('link');
gardenEffects.rel = 'stylesheet';
gardenEffects.href = 'garden-effects.css';
document.head.appendChild(gardenEffects);

document.querySelectorAll('.app-nav').forEach((nav) => {
  if (nav.querySelector('[href="missions.html"]')) return;
  nav.insertAdjacentHTML('beforeend', '<a class="nav-tab" href="growth.html">Growth</a><a class="nav-tab" href="calendar.html">Calendar</a><a class="nav-tab" href="lessons.html">Lessons</a><a class="nav-tab" href="missions.html">Missions</a><a class="nav-tab" href="assignments.html">Assignments</a><a class="nav-tab" href="showcase.html">Showcase</a><a class="nav-tab" href="guides.html">Guides</a>');
});

const ROSY_KEY = 'rosy-routine-state';
const SHARED_STATE_KEY = 'rosy-routine-shared-state';
const ROSY_DEFAULTS = {
  flowers: 0, points: 0, coins: 60, water: 5, fertilizer: 2, streak: 0, lastStudyDate: '', tasks: [], assignments: [], lessons: [], qna: [], unlocked: [], badges: [], xp: 0, sessions: 0, completedTasks: 0, studyDays: [], plants: [], seeds: 2, lastRewardDate: '', rewardStreak: 0,
  soundPreset: 'rain', soundVolume: 0.35, subjectProgress: { Biology: 32, Mathematics: 18, English: 46, French: 0, Igbo: 0, Yoruba: 0 },
  selectedSubject: 'Biology', selectedFlower: 'Rose', customName: '', chatSessions: [], focusMinutes: 25
};

function normalizeSharedProfile(state) {
  const safeState = { ...ROSY_DEFAULTS, ...(state || {}) };
  const subjectOptions = ['Biology', 'Mathematics', 'English', 'Science', 'History', 'Geography', 'French', 'Igbo', 'Yoruba', 'Economics', 'Physics', 'Computer Science'];
  const flowerOptions = ['Rose', 'Tulip', 'Sunflower', 'Lily', 'Daisy', 'Orchid', 'Lavender', 'Peony'];
  safeState.selectedSubject = subjectOptions.includes(safeState.selectedSubject) ? safeState.selectedSubject : ROSY_DEFAULTS.selectedSubject;
  safeState.selectedFlower = flowerOptions.includes(safeState.selectedFlower) ? safeState.selectedFlower : ROSY_DEFAULTS.selectedFlower;
  safeState.customName = typeof safeState.customName === 'string' ? safeState.customName.trim() : '';
  safeState.focusMinutes = [20, 25, 30, 40, 45, 60].includes(Number(safeState.focusMinutes)) ? Number(safeState.focusMinutes) : 25;
  safeState.chatSessions = Array.isArray(safeState.chatSessions) ? safeState.chatSessions : [];
  safeState.subjectProgress = safeState.subjectProgress && typeof safeState.subjectProgress === 'object' ? safeState.subjectProgress : { ...ROSY_DEFAULTS.subjectProgress };
  return safeState;
}

function readSharedProfile() {
  try {
    return normalizeSharedProfile(JSON.parse(localStorage.getItem(SHARED_STATE_KEY) || '{}'));
  } catch {
    return { ...ROSY_DEFAULTS };
  }
}

function rosyState() {
  const saved = JSON.parse(localStorage.getItem(ROSY_KEY) || '{}');
  const shared = readSharedProfile();
  const state = normalizeSharedProfile({ ...ROSY_DEFAULTS, ...saved, ...shared });
  state.tasks = Array.isArray(state.tasks) ? state.tasks : [];
  state.assignments = Array.isArray(state.assignments) ? state.assignments : [];
  state.lessons = Array.isArray(state.lessons) ? state.lessons : [];
  state.qna = Array.isArray(state.qna) ? state.qna : [];
  state.badges = Array.isArray(state.badges) ? state.badges : [];
  state.plants = Array.isArray(state.plants) ? state.plants : [];
  state.studyDays = Array.isArray(state.studyDays) ? state.studyDays : [];
  state.coins = Number.isFinite(state.coins) ? state.coins : Math.max(60, state.points || 0);
  state.water = Number.isFinite(state.water) ? state.water : 5;
  state.fertilizer = Number.isFinite(state.fertilizer) ? state.fertilizer : 2;
  state.seeds = Number.isFinite(state.seeds) ? state.seeds : 2;
  state.subjectProgress = state.subjectProgress && typeof state.subjectProgress === 'object' ? state.subjectProgress : { ...ROSY_DEFAULTS.subjectProgress };
  state.plants = state.plants.map((plant) => ({ ...plant, status: plant.status || 'healthy', growth: plant.growth || 0, wateredAt: plant.wateredAt || plant.lastCare || new Date().toISOString(), fedAt: plant.fedAt || '' }));
  return state;
}

function saveRosyState(state) {
  const normalized = normalizeSharedProfile(state);
  localStorage.setItem(ROSY_KEY, JSON.stringify(normalized));
  localStorage.setItem(SHARED_STATE_KEY, JSON.stringify({
    selectedSubject: normalized.selectedSubject,
    selectedFlower: normalized.selectedFlower,
    customName: normalized.customName,
    focusMinutes: normalized.focusMinutes,
    chatSessions: Array.isArray(normalized.chatSessions) ? normalized.chatSessions : []
  }));
}
function rosyToday() { return new Date().toISOString().slice(0, 10); }
function rosyFormatDate(value) { return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(value)); }
function plantNeedsCare(plant) { return Date.now() - new Date(plant.lastCare).getTime() > 24 * 60 * 60 * 1000; }
function refreshPlantHealth(state) { state.plants.forEach((plant) => { if (plant.status === 'dead') return; const missedHours = (Date.now() - new Date(plant.lastCare).getTime()) / (60 * 60 * 1000); const infestationRoll = missedHours >= 36 && plant.status === 'healthy' && !plant.infested; if (infestationRoll && Math.random() < 0.18) plant.infested = true; if (missedHours >= 72) plant.status = 'dead'; else if (missedHours >= 36) plant.status = 'wilted'; }); return state; }
function showRosyToast(message) { const toast = document.getElementById('rosyToast'); if (!toast) return; toast.textContent = message; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 2400); }

function initRosyShell(activePage) {
  const state = refreshPlantHealth(rosyState());
  saveRosyState(state);
  document.querySelectorAll('[data-page]').forEach((link) => link.classList.toggle('active', link.dataset.page === activePage));
  const topActions = document.querySelector('.top-actions');
  if (topActions && !topActions.querySelector('.account-link')) {
    const profile = JSON.parse(localStorage.getItem('rosy-routine-profile') || 'null');
    const accountLink = document.createElement('a');
    accountLink.className = 'account-link';
    accountLink.href = 'auth.html';
    accountLink.textContent = profile ? (profile.mode === 'google' ? (profile.name || 'Account') : 'Guest mode') : 'Sign in';
    topActions.appendChild(accountLink);
  }
  const status = document.getElementById('offlineStatus');
  const update = () => { if (status) { status.textContent = navigator.onLine ? 'Synced locally' : 'Offline mode'; status.classList.toggle('offline', !navigator.onLine); } };
  window.addEventListener('online', update); window.addEventListener('offline', update); update();
  if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('sw.js'));
  return state;
}

window.rosy = { rosyState, saveRosyState, rosyToday, rosyFormatDate, refreshPlantHealth, showRosyToast, initRosyShell };
