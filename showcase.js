const showcaseState = initRosyShell('showcase');
document.getElementById('showcaseStreak').textContent = showcaseState.streak;
document.getElementById('showcaseStats').textContent = `${showcaseState.sessions} sessions · ${showcaseState.xp} XP · ${showcaseState.flowers} flowers`;
const weeklyBoard = [{ name: 'Maya’s Meadow', score: 18 }, { name: 'Lia’s Little Grove', score: showcaseState.streak }, { name: 'Noor’s Bloom', score: 9 }].sort((a, b) => b.score - a.score);
document.getElementById('leaderboard').innerHTML = weeklyBoard.map((entry, index) => `<div class="leaderboard-row"><span>${index + 1}. ${entry.name}</span><strong>${entry.score}</strong></div>`).join('');
document.getElementById('battleButton').addEventListener('click', () => { document.getElementById('battleStatus').textContent = 'Battle room idea saved · connect Firebase Realtime Database or Supabase Realtime for live opponents.'; showcaseState.xp += 5; saveRosyState(showcaseState); });
