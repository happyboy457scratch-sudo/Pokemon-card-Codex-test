const authPanel = document.getElementById('auth-panel');
const appPanel = document.getElementById('app-panel');
const authForm = document.getElementById('auth-form');
const authMessage = document.getElementById('auth-message');
const usernameGroup = document.getElementById('username-group');
const authSubmit = document.getElementById('auth-submit');
const welcome = document.getElementById('welcome');
const statusEl = document.getElementById('status');
const resultsEl = document.getElementById('results');

const tabLogin = document.getElementById('tab-login');
const tabSignup = document.getElementById('tab-signup');
const logoutBtn = document.getElementById('logout');

let mode = 'login';

function readUsers() {
  return JSON.parse(localStorage.getItem('pps_users') || '[]');
}

function saveUsers(users) {
  localStorage.setItem('pps_users', JSON.stringify(users));
}

function setCurrentUser(user) {
  localStorage.setItem('pps_current_user', JSON.stringify(user));
}

function getCurrentUser() {
  return JSON.parse(localStorage.getItem('pps_current_user') || 'null');
}

function switchMode(nextMode) {
  mode = nextMode;
  const signup = mode === 'signup';
  usernameGroup.classList.toggle('hidden', !signup);
  authSubmit.textContent = signup ? 'Create account' : 'Login';
  tabLogin.classList.toggle('active', !signup);
  tabSignup.classList.toggle('active', signup);
  authMessage.textContent = '';
}

function showApp() {
  const user = getCurrentUser();
  if (user) {
    authPanel.classList.add('hidden');
    appPanel.classList.remove('hidden');
    welcome.textContent = `Welcome, ${user.username}`;
  } else {
    appPanel.classList.add('hidden');
    authPanel.classList.remove('hidden');
  }
}

function currency(v) {
  if (v === undefined || v === null || Number.isNaN(Number(v))) return 'N/A';
  return `$${Number(v).toFixed(2)}`;
}

function renderCards(cards) {
  if (!cards.length) {
    resultsEl.innerHTML = '<p class="muted">No cards found.</p>';
    return;
  }

  resultsEl.innerHTML = cards.map((card) => {
    const prices = card.tcgplayer?.prices || card.cardmarket?.prices || {};
    const bucket = prices.holofoil || prices.normal || prices.reverseHolofoil || prices;
    return `
      <article class="card">
        <img src="${card.images?.large || card.images?.small || ''}" alt="${card.name} card" />
        <div class="card-content">
          <h3>${card.name}</h3>
          <p><strong>Set:</strong> ${card.set?.name || 'Unknown'}</p>
          <p><strong>Rarity:</strong> ${card.rarity || 'Unknown'}</p>
          <p><strong>Market:</strong> ${currency(bucket.market)}</p>
          <p><strong>Low / High:</strong> ${currency(bucket.low)} / ${currency(bucket.high)}</p>
        </div>
      </article>`;
  }).join('');
}

authForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const email = document.getElementById('email').value.trim().toLowerCase();
  const password = document.getElementById('password').value;
  const username = document.getElementById('username').value.trim();
  const users = readUsers();

  if (mode === 'signup') {
    if (username.length < 3 || password.length < 6) {
      authMessage.textContent = 'Username must be 3+ chars and password 6+ chars.';
      return;
    }
    if (users.find((u) => u.email === email)) {
      authMessage.textContent = 'Email already registered.';
      return;
    }
    const user = { username, email, password };
    users.push(user);
    saveUsers(users);
    setCurrentUser({ username, email });
    showApp();
    return;
  }

  const user = users.find((u) => u.email === email && u.password === password);
  if (!user) {
    authMessage.textContent = 'Invalid login.';
    return;
  }

  setCurrentUser({ username: user.username, email: user.email });
  showApp();
});

tabLogin.addEventListener('click', () => switchMode('login'));
tabSignup.addEventListener('click', () => switchMode('signup'));
logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('pps_current_user');
  showApp();
});

document.getElementById('search-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const query = document.getElementById('search').value.trim();
  if (!query) return;

  statusEl.textContent = 'Scraping prices and photos...';
  resultsEl.innerHTML = '';

  try {
    const url = `https://api.pokemontcg.io/v2/cards?q=name:${encodeURIComponent(query)}*&pageSize=12`;
    const response = await fetch(url);
    const data = await response.json();
    renderCards(data.data || []);
    statusEl.textContent = `Loaded ${data.data?.length || 0} result(s).`;
  } catch (error) {
    statusEl.textContent = 'Could not fetch data right now.';
  }
});

showApp();
