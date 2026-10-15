const focusState = initRosyShell('focus'); let minutes = Number(focusState.focusMinutes) || 25; let secondsLeft = minutes * 60; let interval = null; let audioContext = null; let oscillator = null;
const timer = document.getElementById('focusTimer'); const button = document.getElementById('focusStart'); const ring = document.querySelector('.focus-ring');
const subjectSelect = document.getElementById('profileSubject'); const flowerSelect = document.getElementById('profileFlower');

function syncProfileInputs() {
  if (!subjectSelect || !flowerSelect) return;
  subjectSelect.value = focusState.selectedSubject || 'Biology';
  flowerSelect.value = focusState.selectedFlower || 'Rose';
}

function renderFocus() { const min = Math.floor(secondsLeft / 60).toString().padStart(2, '0'); const sec = (secondsLeft % 60).toString().padStart(2, '0'); timer.textContent = `${min}:${sec}`; const progress = ((minutes * 60 - secondsLeft) / (minutes * 60)) * 360; ring.style.background = `conic-gradient(var(--rose) ${progress}deg,#f8e5ea ${progress}deg)`; }
function resetFocus() { clearInterval(interval); interval = null; secondsLeft = minutes * 60; button.textContent = 'Start timer'; if (window.rosySounds) window.rosySounds.stopSounds(); renderFocus(); }
function startFocusSession() {
  if (window.rosySounds) window.rosySounds.startDefaultSound();
  button.textContent = 'Pause timer';
  if (document.fullscreenEnabled && !document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  }
  interval = setInterval(() => {
    secondsLeft -= 1;
    renderFocus();
    if (document.hidden || (document.fullscreenEnabled && document.fullscreenElement === null && interval)) {
      clearInterval(interval);
      interval = null;
      resetFocus();
      startFocusSession();
      showRosyToast('Focus session restarted after leaving the room.');
      return;
    }
    if (secondsLeft <= 0) {
      resetFocus();
      completeFocus();
    }
  }, 1000);
}
function playFocusChime() { audioContext = audioContext || new AudioContext(); oscillator = audioContext.createOscillator(); const gain = audioContext.createGain(); oscillator.frequency.value = 660; gain.gain.setValueAtTime(.0001, audioContext.currentTime); gain.gain.exponentialRampToValueAtTime(.12, audioContext.currentTime + .03); gain.gain.exponentialRampToValueAtTime(.0001, audioContext.currentTime + .8); oscillator.connect(gain).connect(audioContext.destination); oscillator.start(); oscillator.stop(audioContext.currentTime + .8); }
function completeFocus() { focusState.coins += 25; focusState.points += 25; focusState.water += 2; focusState.fertilizer += 1; focusState.xp += 25; focusState.sessions += 1; focusState.flowers = Math.min(12, focusState.flowers + 1); const today = rosyToday(); if (!focusState.studyDays.includes(today)) focusState.studyDays.push(today); const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1); if (focusState.lastStudyDate !== today) focusState.streak = focusState.lastStudyDate === yesterday.toISOString().slice(0, 10) ? focusState.streak + 1 : 1; focusState.lastStudyDate = today; saveRosyState(focusState); playFocusChime(); document.body.classList.add('bloom-complete'); setTimeout(() => document.body.classList.remove('bloom-complete'), 1800); document.getElementById('focusMessage').textContent = `Beautiful work on ${focusState.selectedSubject || 'your subject'}. +25 coins, +2 water, +1 fertilizer. Pink streak: ${focusState.streak} day${focusState.streak === 1 ? '' : 's'}.`; showRosyToast('Session complete · garden supplies earned'); }
button.addEventListener('click', () => { if (interval) { clearInterval(interval); interval = null; button.textContent = 'Resume timer'; return; } startFocusSession(); });
document.getElementById('focusReset').addEventListener('click', resetFocus); document.querySelectorAll('[data-duration]').forEach((chip) => chip.addEventListener('click', () => { if (interval) return; document.querySelector('.duration-chip.active').classList.remove('active'); chip.classList.add('active'); minutes = Number(chip.dataset.duration); focusState.focusMinutes = minutes; saveRosyState(focusState); resetFocus(); }));
subjectSelect.addEventListener('change', (event) => { focusState.selectedSubject = event.target.value; saveRosyState(focusState); });
flowerSelect.addEventListener('change', (event) => { focusState.selectedFlower = event.target.value; saveRosyState(focusState); showRosyToast(`${event.target.value} selected for your next bloom.`); });
document.addEventListener('fullscreenchange', () => { if (interval && !document.fullscreenElement) { clearInterval(interval); interval = null; resetFocus(); startFocusSession(); showRosyToast('Focus room restarted in fullscreen.'); } });
document.addEventListener('visibilitychange', () => { if (document.hidden && interval) { clearInterval(interval); interval = null; resetFocus(); startFocusSession(); showRosyToast('You left the room, so the timer restarted.'); } });
renderFocus(); syncProfileInputs();
