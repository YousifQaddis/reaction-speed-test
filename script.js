// State
let gameState = 'idle'; // 'idle' | 'waiting' | 'go'
let startTime = 0;
let lastMs = null;
let bestMs = null;
let times = []; // last N results
let roundsTarget = 5;
let roundsDone = 0;
let pendingTimer = null;

// Elements
const stage = document.getElementById('stage');
const stateText = document.getElementById('stateText');
const hint = document.getElementById('hint');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const lastEl = document.getElementById('last');
const bestEl = document.getElementById('best');
const avgEl = document.getElementById('avg');
const trialsEl = document.getElementById('trials');
const delayRange = document.getElementById('delayRange');
const roundsSelect = document.getElementById('rounds');
const list = document.getElementById('list');

// 1) startGame(): prepares waiting state and schedules the signal
function startGame() {
  clearTimeout(pendingTimer);
  gameState = 'waiting';
  roundsDone = Math.min(roundsDone, roundsTarget); // safeguard
  stage.classList.remove('tooSoon');
  stateText.textContent = 'Wait for GREEN…';
  stateText.className = 'state wait';
  hint.textContent = 'Don’t click yet.';
  const delay = getRandomDelay();
  pendingTimer = setTimeout(showSignal, delay);
}

// 2) getRandomDelay(): compute a random delay based on selection
function getRandomDelay() {
  const mode = delayRange.value;
  if (mode === 'short') return randBetween(600, 1400);
  if (mode === 'long')  return randBetween(2000, 5000);
  return randBetween(1000, 3000); // medium default
}
function randBetween(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

// 3) showSignal(): switch to GO state and mark the start time
function showSignal() {
  gameState = 'go';
  startTime = performance.now();
  stateText.textContent = 'GO!';
  stateText.className = 'state go';
  hint.textContent = 'Click or press space/enter NOW!';
}

// 4) handleClick(): handle user input, compute ms, or penalty if too soon
function handleClick() {
  if (gameState === 'waiting') {
    // clicked early — penalize
    stage.classList.add('tooSoon');
    stateText.textContent = 'Too soon!';
    stateText.className = 'state idle';
    hint.textContent = 'Click Start and wait for GREEN.';
    clearTimeout(pendingTimer);
    gameState = 'idle';
    return;
  }
  if (gameState !== 'go') return;
  const ms = Math.round(performance.now() - startTime);
  lastMs = ms;
  bestMs = (bestMs === null) ? ms : Math.min(bestMs, ms);
  times.push(ms);
  if (times.length > 5) times.shift();
  roundsDone++;
  updateStats();
  // Auto-continue until target rounds (or endless)
  if (String(roundsTarget) === 'Infinity' || roundsDone < roundsTarget) {
    scheduleNext();
  } else {
    endSeries();
  }
}

// 5) scheduleNext(): small pause then re-enter waiting
function scheduleNext() {
  gameState = 'idle';
  stateText.textContent = 'Nice! Next round…';
  stateText.className = 'state idle';
  hint.textContent = 'Click or press space/enter to start next.';
  setTimeout(startGame, 600);
}

// 6) updateStats(): update HUD and recent list
function updateStats() {
  lastEl.textContent = (lastMs == null ? '—' : lastMs);
  bestEl.textContent = (bestMs == null ? '—' : bestMs);
  const avg = times.length ? Math.round(times.reduce((a,b)=>a+b,0)/times.length) : '—';
  avgEl.textContent = (avg === '—' ? '—' : avg);
  trialsEl.textContent = String(roundsDone);
  list.innerHTML = times.map(t => `<li>${t} ms</li>`).join('');
}

// 7) resetGame(): clear state, stats, UI
function resetGame() {
  clearTimeout(pendingTimer);
  gameState = 'idle';
  startTime = 0;
  lastMs = null;
  bestMs = null;
  times = [];
  roundsDone = 0;
  stateText.textContent = 'Click START';
  stateText.className = 'state idle';
  hint.textContent = 'Wait for GREEN, then click or press space/enter.';
  updateStats();
}

// 8) endSeries(): end of selected rounds, show summary
function endSeries() {
  gameState = 'idle';
  const avg = times.length ? Math.round(times.reduce((a,b)=>a+b,0)/times.length) : null;
  stateText.textContent = avg ? `Series done — avg ${avg} ms` : 'Series done';
  stateText.className = 'state idle';
  hint.textContent = 'Press Start to try again or change settings.';
}

// Events
startBtn.addEventListener('click', startGame);
resetBtn.addEventListener('click', resetGame);
stage.addEventListener('click', () => {
  if (gameState === 'idle') return;
  handleClick();
});
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' || e.code === 'Enter') {
    if (gameState === 'idle') return;
    e.preventDefault();
    handleClick();
  }
});

roundsSelect.addEventListener('change', () => {
  const val = roundsSelect.value;
  roundsTarget = (val === '∞') ? Infinity : parseInt(val, 10);
  resetGame();
});

resetGame();
