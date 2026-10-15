const gardenState = initRosyShell('garden');
const plantNames = { rose: 'Blush rose', tulip: 'Morning tulip', star: 'Star flower', daisy: 'Cloud daisy', lotus: 'Moon lotus' };
const plantSymbols = { rose: '✿', tulip: '❀', star: '✦', daisy: '❁', lotus: '✺' };
const plantGrid = document.getElementById('plantGrid');

function growthStage(plant) {
  if (plant.status === 'dead') return 'dead';
  if (plant.growth >= 4) return 'bloom';
  if (plant.growth >= 3) return 'bud';
  if (plant.growth >= 1) return 'sprout';
  return 'seed';
}

function addGardenSupplies() {
  const toolbar = document.querySelector('.garden-toolbar');
  if (document.getElementById('gardenSupplies')) return;
  const supplies = document.createElement('div');
  supplies.id = 'gardenSupplies';
  supplies.className = 'garden-supplies';
  toolbar.appendChild(supplies);
  const seedOptions = document.querySelector('.seed-options');
  if (seedOptions && !seedOptions.querySelector('[data-seed="daisy"]')) seedOptions.insertAdjacentHTML('beforeend', '<button class="seed-option" data-seed="daisy" data-cost="45" type="button"><span class="seed-illustration">❁</span><strong>Cloud daisy</strong><small>45 coins · cheerful bloom</small></button><button class="seed-option" data-seed="lotus" data-cost="60" type="button"><span class="seed-illustration">✺</span><strong>Moon lotus</strong><small>60 coins · rare bloom</small></button>');
}

function renderGardenPage() {
  refreshPlantHealth(gardenState);
  saveRosyState(gardenState);
  addGardenSupplies();
  document.getElementById('coinCount').textContent = gardenState.coins;
  document.getElementById('shopCoinCount').textContent = gardenState.coins;
  document.getElementById('plantCount').textContent = gardenState.plants.filter((plant) => plant.status !== 'dead').length;
  document.getElementById('gardenStatus').textContent = gardenState.plants.some((plant) => plant.infested) ? 'A few plants need gentle treatment.' : gardenState.plants.some((plant) => plant.status === 'wilted') ? 'Some plants need water today.' : 'Everything is looking beautifully cared for.';
  document.getElementById('gardenSupplies').innerHTML = `<span>💧 ${gardenState.water} water</span><span>✦ ${gardenState.fertilizer} fertilizer</span>`;
  plantGrid.innerHTML = gardenState.plants.length ? gardenState.plants.map((plant) => {
    const stage = growthStage(plant);
    const issue = plant.infested ? 'Infested' : plant.status === 'wilted' ? 'Thirsty' : plant.status === 'dead' ? 'Gone to seed' : 'Thriving';
    const action = plant.infested ? 'Treat plant · 1 fertilizer' : plant.status === 'wilted' ? 'Water plant · 1 water' : 'Water & grow · 1 water';
    return `<article class="plant-card ${plant.status} ${plant.infested ? 'infested' : ''}"><div class="plant-scene ${plant.type} stage-${stage}"><span>${plant.status === 'dead' ? '·' : plantSymbols[plant.type]}</span><i></i><b class="growth-label">${stage === 'seed' ? 'seedling' : stage}</b>${plant.infested ? '<em class="pest-mark">● ●</em>' : ''}</div><div class="plant-info"><div><strong>${plantNames[plant.type]}</strong><small>Growth ${plant.growth || 0}/4 · cared ${plant.careCount || 0} times</small></div><span class="plant-status">${issue}</span></div><button class="care-button" data-plant-id="${plant.id}" type="button" ${plant.status === 'dead' ? 'disabled' : ''}>${action}</button></article>`;
  }).join('') : '<div class="empty-garden"><span>✿</span><h2>Your garden is waiting.</h2><p>Study to earn supplies, then buy a seed and grow your first little ritual.</p></div>';
  document.querySelectorAll('.seed-option').forEach((button) => { button.disabled = gardenState.coins < Number(button.dataset.cost); });
}

function careForPlant(id) {
  const plant = gardenState.plants.find((item) => item.id === id);
  if (!plant || plant.status === 'dead') return;
  if (plant.infested) {
    if (gardenState.fertilizer < 1) { showRosyToast('Study a little more to earn fertilizer.'); return; }
    gardenState.fertilizer -= 1; plant.infested = false; plant.status = 'healthy'; showRosyToast('The pests are gone. Your plant feels better.');
  } else {
    if (gardenState.water < 1) { showRosyToast('Complete a study session to earn water.'); return; }
    gardenState.water -= 1; plant.lastCare = new Date().toISOString(); plant.status = 'healthy'; plant.growth = Math.min(4, (plant.growth || 0) + 1); plant.careCount = (plant.careCount || 0) + 1; showRosyToast(plant.growth >= 4 ? 'A beautiful bloom opened.' : 'Your plant grew a little.');
  }
  saveRosyState(gardenState); renderGardenPage();
}

function plantSeed(type, cost) {
  if (gardenState.coins < cost) { showRosyToast('Keep studying to earn more coins.'); return; }
  gardenState.coins -= cost;
  gardenState.plants.push({ id: `${Date.now()}-${type}`, type, plantedAt: new Date().toISOString(), lastCare: new Date().toISOString(), status: 'healthy', growth: 0, careCount: 0, infested: false });
  saveRosyState(gardenState); renderGardenPage(); showRosyToast(`${plantNames[type]} planted.`);
}

plantGrid.addEventListener('click', (event) => { const button = event.target.closest('[data-plant-id]'); if (button) careForPlant(button.dataset.plantId); });
document.querySelectorAll('.seed-option').forEach((button) => button.addEventListener('click', () => plantSeed(button.dataset.seed, Number(button.dataset.cost))));
document.getElementById('waterAll').addEventListener('click', () => {
  const livingPlants = gardenState.plants.filter((plant) => plant.status !== 'dead' && !plant.infested);
  if (gardenState.water < livingPlants.length) { showRosyToast(`You need ${livingPlants.length} water for the whole garden.`); return; }
  livingPlants.forEach((plant) => { gardenState.water -= 1; plant.lastCare = new Date().toISOString(); plant.status = 'healthy'; plant.growth = Math.min(4, (plant.growth || 0) + 1); plant.careCount = (plant.careCount || 0) + 1; });
  saveRosyState(gardenState); renderGardenPage(); showRosyToast('Your garden feels refreshed and grew.');
});
renderGardenPage();
