import { Cow } from './cow.js';

// ===== CONFIG — edit these when you launch =====
const TOKEN = {
  name: 'Chronically On Web',
  ticker: '$COW',
  ca: '', // paste the contract address here when live
  supply: '1,000,000,000',
  launch: '2026-10-07T00:00:00Z', // online-streak counter starts here
  links: {
    x: 'https://x.com/',
    telegram: 'https://t.me/',
    dex: 'https://dexscreener.com/solana',
    buy: 'https://jup.ag',
  },
};

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const pad = (n) => String(n).padStart(2, '0');
// inline SVG icon from the sprite in index.html
const ic = (name, cls = '') => `<svg class="ico ${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`;

// ===== toast =====
const toast = document.createElement('div');
toast.className = 'toast';
document.body.appendChild(toast);
let toastT;
function showToast(msg) {
  toast.textContent = msg; toast.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => toast.classList.remove('show'), 2200);
}

// ===== nav / links / misc =====
$('#navBurger').addEventListener('click', () => $('#nav').classList.toggle('open'));
$$('.nav-links a').forEach((a) => a.addEventListener('click', () => $('#nav').classList.remove('open')));
$('#year').textContent = new Date().getFullYear();
$('#linkX').href = TOKEN.links.x;
$('#linkTg').href = TOKEN.links.telegram;
$('#linkDex').href = TOKEN.links.dex;
$('#buyBtn').href = TOKEN.links.buy;
if (TOKEN.ca) $('#caText').textContent = TOKEN.ca;
$('#copyCa').addEventListener('click', async () => {
  if (!TOKEN.ca) return showToast('Contract address drops at launch — stay online');
  try { await navigator.clipboard.writeText(TOKEN.ca); showToast('Contract address copied'); } catch { showToast('Copy failed — select the text manually'); }
});

// ===== uptime / clocks =====
const launch = new Date(TOKEN.launch).getTime();
function tickClocks() {
  const now = new Date();
  const diff = Math.max(0, now.getTime() - launch);
  const d = Math.floor(diff / 86400000), h = Math.floor(diff / 3600000) % 24, m = Math.floor(diff / 60000) % 60, s = Math.floor(diff / 1000) % 60;
  const up = `${d}d ${pad(h)}:${pad(m)}:${pad(s)}`;
  $('#statUptime').textContent = up;
  $('#osClock').textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  $('#trayClock').textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  $$('[data-uptime]').forEach((el) => (el.textContent = up));
  $$('[data-utc]').forEach((el) => (el.textContent = now.toUTCString().slice(17, 25) + ' UTC'));
}
setInterval(tickClocks, 1000); tickClocks();

// ===== 3D cows =====
const STATUS = {
  wave: 'COW is waving at you', wink: 'COW winked. it was aimed at you.', blink: 'COW blinked. still awake.', nod: 'COW agrees.',
  shake: 'COW disagrees. respectfully.', dance: 'COW is dancing', type: 'COW is typing…', jump: 'COW jumped. chart did too (probably)',
  spin: 'COW is spinning. do not disturb.', happy: 'COW is happy :3', sleepy: 'COW is NOT sleeping. just resting eyes.', earflick: 'COW heard something.',
  lookaround: 'COW is browsing…',
};

const heroCow = new Cow($('#heroCanvas'), {
  cameraZ: 8.9, cameraY: 0.3,
  onClick: () => spawnHearts($('#heroCanvas').parentElement, 3),
});

const liveCow = new Cow($('#liveCanvas'), {
  cameraZ: 8.2, cameraY: 0.25,
  onEmote: (name) => {
    const st = $('#streamStatus');
    st.textContent = STATUS[name] || `COW: ${name}`;
    clearTimeout(st._t);
    st._t = setTimeout(() => (st.textContent = 'COW is idle · browsing'), 3200);
  },
  onClick: (name) => { chatSystem(`you poked COW → ${name}`); spawnHearts($('#hearts').parentElement, 4); },
});

$$('[data-emote]').forEach((b) => b.addEventListener('click', () => {
  const name = b.dataset.emote;
  liveCow.play(name);
  chatSystem(`you used /${name}`);
  setTimeout(() => chatBot(name), 500 + Math.random() * 900);
  $('#live').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}));

// ===== floating reactions (SVG hearts / sparkles / cows) =====
const REACTIONS = [
  ['heart', '#ff4d6d'], ['heart', '#3b82f6'], ['heart', '#3ef2b3'], ['heart', '#22d3ee'], ['cow', '#f6ead2'], ['sparkle', '#ffd34d'],
];
function spawnHearts(container, n = 1) {
  const layer = container.querySelector('.hearts') || (() => { const d = document.createElement('div'); d.className = 'hearts'; container.appendChild(d); return d; })();
  for (let i = 0; i < n; i++) {
    const [name, color] = rand(REACTIONS);
    const s = document.createElement('span');
    s.innerHTML = ic(name, name === 'heart' ? 'fill' : '');
    s.style.color = color;
    s.style.left = 30 + Math.random() * 40 + '%';
    s.style.setProperty('--dx', (Math.random() * 160 - 80) + 'px');
    s.style.setProperty('--rot', (Math.random() * 60 - 30) + 'deg');
    s.style.animationDelay = Math.random() * 0.4 + 's';
    layer.appendChild(s);
    setTimeout(() => s.remove(), 2800);
  }
}
$('#heartBtn').addEventListener('click', () => {
  spawnHearts($('#hearts').parentElement, 6);
  if (!liveCow.isBusy || Math.random() < 0.3) liveCow.play(rand(['happy', 'wink', 'wave']));
  chatSystem('you sent a heart');
});

// ===== chat =====
const CHATTERS = [
  { n: 'cowfan', c: '#60a5fa', l: 'VIP' }, { n: 'webnomad', c: '#f472b6', l: '' }, { n: 'memelord', c: '#f59e0b', l: 'MOD' }, { n: 'devcow', c: '#34d399', l: 'DEV' },
  { n: 'chilluser', c: '#a78bfa', l: '' }, { n: 'solgirl', c: '#22d3ee', l: '' }, { n: 'degen_dan', c: '#fb7185', l: '' }, { n: 'gm_enjoyer', c: '#fbbf24', l: '' },
  { n: 'nightowl', c: '#c084fc', l: '' }, { n: 'pixelcow', c: '#4ade80', l: '' }, { n: 'tabhoarder', c: '#38bdf8', l: '' }, { n: 'wen_lambo', c: '#f97316', l: '' },
];
const CHAT_LINES = [
  'this cow is goated', 'always online fr', 'legend', 'build more!', 'mooing through life', 'gm cow', 'wen moon', 'touch grass? never heard of her',
  'the chart is just vibes', 'chronically on web is a lifestyle', 'someone tell COW to sleep', 'ser the cow waved at me', 'is COW ever offline??', 'uptime 100% confirmed',
  '$COW to the pasture', 'bro has 247 tabs open', 'cow pls wink', 'DO THE DANCE', 'i bought more. do not tell my wife', 'internet = happy place <3',
  'this is the most online cow i have ever seen', 'posting through it', 'overthinking the dip rn', 'research: complete. conclusion: moo', 'who needs sleep when you have wifi',
  'cow typing speed is unreal', 'LFG', 'gm gm gm', 'the laptop sticker is a cow. of a cow. genius.', 'chart looks like my sleep schedule (none)',
  'wave at me cow!!', 'can we get a spin', 'blink twice if ur ok cow', 'rare offline moment: never', 'certified still online',
];
const COW_REPLIES = {
  wave: ['hi chat o/', 'waving at every single one of you. individually.', 'o/'],
  wink: [';)', 'that one was for you', 'wink deployed'],
  blink: ['blinked. missed a candle.', 'eyes: lubricated. tabs: still open.', 'blink complete'],
  nod: ['yes.', 'agreed. buying more wifi.', 'nod nod'],
  shake: ['no.', 'absolutely not logging off', 'shake shake'],
  dance: ['the floor is lava and the lava is a chart', 'dancing through the dip', 'MOOve your body'],
  type: ['typing a post… hold on', 'kjsdhfkjsdhf (that was a post)', 'posting speed: cow'],
  jump: ['boing', 'the jump is the roadmap', 'that was 0.3s of being offline, never again'],
  spin: ['dizzy. still online.', 'rotating my portfolio', 'wheeeee'],
  happy: [':3', 'happy cow, happy chart', 'internet = happy place <3'],
  sleepy: ['NOT sleeping. resting eyes between tabs.', 'zzz… jk', 'sleep is a scam invented by offline people'],
  gm: ['gm chat', 'gm! already online for 19 hours', 'gm gm'],
  moon: ['wen moon? i am the moon. i never set.', 'moon is just a bigger tab', 'researching the moon'],
  buy: ['buy button is in the nav. always has been.', 'the herd welcomes you', 'swap SOL → $COW on Jupiter. then stay online.'],
  hi: ['hi!! o/', 'hello fellow online person', 'welcome to the stream that never ends'],
  love: ['love you too chat <3', '<3 moo', 'blushing in cow'],
  default: ['moo', 'noted. overthinking it now.', 'adding that to my 247 tabs', 'interesting. researching.', 'moo?', 'posting about this later', 'brb (not really, never leaving)'],
};

const chatLog = $('#chatLog');
function addMsg(html, cls = '') {
  const d = document.createElement('div');
  d.className = 'msg ' + cls;
  d.innerHTML = html;
  chatLog.appendChild(d);
  while (chatLog.children.length > 60) chatLog.firstChild.remove();
  chatLog.scrollTop = chatLog.scrollHeight;
}
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function chatUser(u, text) { addMsg(`${u.l ? `<span class="lvl">${u.l}</span>` : ''}<b style="color:${u.c}">${u.n}</b>${esc(text)}`); }
function chatSystem(text) { addMsg(esc(text), 'sys'); }
function chatCow(text) { addMsg(`<span class="lvl">${ic('cow')} LIVE</span><b>COW</b>${esc(text)}`, 'cow'); }
function chatBot(key) { chatCow(rand(COW_REPLIES[key] || COW_REPLIES.default)); }

chatSystem('welcome to the stream · COW has been online since forever');
chatUser(CHATTERS[0], 'this cow is goated');
chatUser(CHATTERS[1], 'always online fr');
chatUser(CHATTERS[2], 'legend');
chatUser(CHATTERS[3], 'build more!');
chatUser(CHATTERS[4], 'mooing through life');

function randomChat() {
  chatUser(rand(CHATTERS), rand(CHAT_LINES));
  setTimeout(randomChat, 2500 + Math.random() * 4500);
}
setTimeout(randomChat, 2500);

const viewersEl = $('#viewers');
let viewers = 1248;
setInterval(() => { viewers = Math.max(900, viewers + Math.round(Math.random() * 30 - 12)); viewersEl.textContent = viewers.toLocaleString(); }, 3000);

$('#chatForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const input = $('#chatInput');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  addMsg(`<b>you</b>${esc(text)}`, 'you');
  const t = text.toLowerCase();
  const map = [
    [/wave|hi\b|hello|hey/, 'wave', 'hi'], [/wink/, 'wink', 'wink'], [/blink/, 'blink', 'blink'], [/nod|yes|agree/, 'nod', 'nod'], [/no\b|nope|shake/, 'shake', 'shake'],
    [/dance|party/, 'dance', 'dance'], [/type|post/, 'type', 'type'], [/jump|pump/, 'jump', 'jump'], [/spin|turn/, 'spin', 'spin'], [/happy|love|<3/, 'happy', 'love'],
    [/sleep|tired|rest/, 'sleepy', 'sleepy'], [/\bgm\b|morning/, 'wave', 'gm'], [/moon|wen/, 'jump', 'moon'], [/buy|ca\b|contract|how/, 'nod', 'buy'],
  ];
  let hit = null;
  for (const [re, emote, reply] of map) if (re.test(t)) { hit = { emote, reply }; break; }
  setTimeout(() => {
    if (hit) { liveCow.play(hit.emote); chatBot(hit.reply); }
    else { liveCow.play(rand(['lookaround', 'nod', 'earflick', 'type'])); chatBot('default'); }
  }, 500);
  if (/wave|hi\b|hello|hey|<3|love/.test(t)) spawnHearts($('#hearts').parentElement, 2);
});

// ===== COW OS =====
const desktop = $('#desktop');
const winLayer = $('#osWindows');
const tasks = $('#osTasks');
const apps = new Map();
let zTop = 10;

const APP_META = {
  browse: { icon: 'globe', name: 'Browsing', title: 'Browsing — cow://trending', w: 480 },
  post: { icon: 'pencil', name: 'Posting', title: 'Posting…', w: 440 },
  research: { icon: 'search', name: 'Research', title: 'Research', w: 460 },
  overthink: { icon: 'spiral', name: 'Overthinking', title: 'Overthinking.exe', w: 420 },
  online: { icon: 'online', name: 'Still Online', title: 'Still Online…', w: 400 },
  analytics: { icon: 'trend', name: 'Analytics', title: 'Analytics', w: 420 },
  terminal: { icon: 'terminal', name: 'Terminal', title: 'terminal — cow@web', w: 460 },
};

function openApp(id) {
  if (apps.has(id)) { const a = apps.get(id); a.el.classList.remove('min'); focusApp(id); return; }
  const meta = APP_META[id];
  const el = document.createElement('div');
  el.className = 'app';
  el.style.width = meta.w + 'px';
  const count = apps.size;
  const maxLeft = Math.max(100, winLayer.clientWidth - meta.w - 270);
  el.style.left = Math.min(215 + count * 44, maxLeft) + 'px';
  el.style.top = Math.min(16 + count * 36, 200) + 'px';
  el.innerHTML = `<div class="win-bar"><span class="dots"><i></i><i></i><i></i></span><span class="win-title">${ic(meta.icon)} ${meta.title}</span><span class="win-actions"><button class="app-min" title="Minimize">—</button><button class="app-close" title="Close">✕</button></span></div><div class="app-body"></div>`;
  winLayer.appendChild(el);
  const task = document.createElement('button');
  task.innerHTML = `${ic(meta.icon)} ${meta.name}`;
  task.addEventListener('click', () => { if (el.classList.contains('min')) { el.classList.remove('min'); focusApp(id); } else if (el.classList.contains('focused')) { el.classList.add('min'); task.classList.remove('active'); } else focusApp(id); });
  tasks.appendChild(task);
  const app = { el, task, id };
  apps.set(id, app);
  APP_BUILDERS[id](el.querySelector('.app-body'), app);
  el.querySelector('.app-close').addEventListener('click', (e) => { e.stopPropagation(); closeApp(id); });
  el.querySelector('.app-min').addEventListener('click', (e) => { e.stopPropagation(); el.classList.add('min'); task.classList.remove('active'); });
  el.addEventListener('pointerdown', () => focusApp(id));
  makeDraggable(el, el.querySelector('.win-bar'));
  focusApp(id);
  const cb = $(`.os-checklist label[data-app="${id}"] input`);
  if (cb) cb.checked = true;
}
function focusApp(id) {
  apps.forEach((a) => { a.el.classList.remove('focused'); a.task.classList.remove('active'); });
  const a = apps.get(id); if (!a) return;
  a.el.classList.add('focused'); a.task.classList.add('active');
  a.el.style.zIndex = ++zTop;
}
function closeApp(id) {
  const a = apps.get(id); if (!a) return;
  if (a.cleanup) a.cleanup();
  a.el.remove(); a.task.remove(); apps.delete(id);
}
function makeDraggable(el, handle) {
  let sx, sy, ox, oy, dragging = false;
  handle.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button')) return;
    dragging = true; sx = e.clientX; sy = e.clientY; ox = el.offsetLeft; oy = el.offsetTop;
    handle.setPointerCapture(e.pointerId);
  });
  handle.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const maxX = winLayer.clientWidth - 80, maxY = winLayer.clientHeight - 40;
    el.style.left = Math.max(-el.offsetWidth + 80, Math.min(maxX, ox + e.clientX - sx)) + 'px';
    el.style.top = Math.max(0, Math.min(maxY, oy + e.clientY - sy)) + 'px';
  });
  const stop = () => (dragging = false);
  handle.addEventListener('pointerup', stop); handle.addEventListener('pointercancel', stop);
}

$$('[data-app]').forEach((el) => {
  el.addEventListener('click', (e) => {
    if (el.tagName === 'LABEL') { e.preventDefault(); }
    openApp(el.dataset.app);
  });
});
$('#osStart').addEventListener('click', () => {
  const closedIds = Object.keys(APP_META).filter((id) => !apps.has(id));
  if (closedIds.length) openApp(closedIds[0]); else showToast('Every app is already open. Peak COW.');
});

// ---- app builders ----
const APP_BUILDERS = {
  browse(body) {
    const SITES = [
      ['chart', 'Dexscreener', 'overthink the $COW chart in real time', TOKEN.links.dex],
      ['planet', 'Jupiter', 'swap SOL → $COW with the best route', 'https://jup.ag'],
      ['pill', 'pump.fun', 'where every cow is born', 'https://pump.fun'],
      ['search', 'Solscan', 'verify the contract, read the chain', 'https://solscan.io'],
      ['ghost', 'Phantom', 'the wallet. download it, then never close it.', 'https://phantom.app'],
      ['x', 'X / Twitter', 'the posting arena', TOKEN.links.x],
      ['send', 'Telegram', 'the chat that never sleeps', TOKEN.links.telegram],
    ];
    const RABBIT = [
      ['How many tabs is too many tabs? (Scientists: "yes")', 'A 4,000 word investigation. COW has read it twice.'],
      ['Top 10 cows of the internet, ranked by uptime', 'COW is #1 through #7. The list was written by COW.'],
      ['Is sleep just being offline with extra steps?', 'An essay. Conclusion: yes. Action item: none.'],
      ['Why your portfolio looks like a cow pattern (and why that\'s bullish)', 'Spots = support levels. Trust the pattern.'],
      ['Digital nomad setup 2026: laptop, cow, vibes', 'The minimalist guide to being maximally online.'],
      ['Internet culture trends: the "still online" era', 'Everyone is COW now. You just didn\'t notice.'],
    ];
    body.innerHTML = `<div class="app-toolbar"><button class="app-btn alt">←</button><button class="app-btn alt">→</button><button class="app-btn alt">${ic('spin')}</button><input value="cow://trending" readonly /></div>
      <div class="link-list">${SITES.map((s) => `<a href="${s[3]}" target="_blank" rel="noopener"><span>${ic(s[0])}</span><div><b>${s[1]}</b><small>${s[2]}</small></div></a>`).join('')}</div>
      <div class="page-card"><h4 class="rh"></h4><p class="muted rp" style="margin:0"></p><button class="app-btn" style="margin-top:.5rem">${ic('cow')} I'm feeling lucky</button></div>`;
    const rh = body.querySelector('.rh'), rp = body.querySelector('.rp');
    const lucky = () => { const r = rand(RABBIT); rh.textContent = r[0]; rp.textContent = r[1]; };
    lucky();
    body.querySelector('.page-card .app-btn').addEventListener('click', () => { lucky(); liveCow.play('lookaround'); });
  },

  post(body) {
    const POSTS = [
      'gm. i have been online for 19 hours. this is a cry for help (it is not) $COW',
      'just finished researching. conclusion: moo. $COW',
      'they said touch grass. i opened a tab about grass. $COW',
      'chart went down so i opened 12 more tabs. problem solved. $COW',
      'internet = happy place <3 $COW',
      'posting through it. always. forever. $COW',
      'if you are reading this, you are chronically on web too. welcome to the herd. $COW',
      'sleep is just being offline with extra steps $COW',
      'i am not addicted to the internet. the internet is addicted to me. $COW',
      'overthinking the candle, posting the meme, researching the dip. multitasking. $COW',
    ];
    body.innerHTML = `<textarea class="app-input"></textarea>
      <div class="app-toolbar" style="margin:.6rem 0 0"><button class="app-btn alt gen">${ic('dice')} Generate</button><button class="app-btn alt copy">${ic('copy')} Copy</button><button class="app-btn post">Post on ${ic('x')}</button></div>
      <ul class="progress-list"><li class="todo">Writing post…</li><li class="todo">Adding media…</li><li class="todo">Optimizing…</li><li class="todo">Posting…</li></ul>
      <div class="muted small res" style="margin-top:.5rem"></div>`;
    const ta = body.querySelector('textarea'); ta.value = rand(POSTS);
    const items = body.querySelectorAll('.progress-list li'); const res = body.querySelector('.res');
    body.querySelector('.gen').addEventListener('click', () => { ta.value = rand(POSTS); liveCow.play('type'); });
    body.querySelector('.copy').addEventListener('click', async () => { try { await navigator.clipboard.writeText(ta.value); showToast('Post copied'); } catch { showToast('Copy failed'); } });
    body.querySelector('.post').addEventListener('click', () => {
      items.forEach((li) => (li.className = 'todo')); res.textContent = '';
      liveCow.play('type');
      let i = 0;
      const step = () => {
        if (i > 0) items[i - 1].className = 'done';
        if (i < items.length) { items[i].className = 'doing'; i++; setTimeout(step, 550); }
        else { res.textContent = '✓ Posted. Engagement +248%. Opening X…'; window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(ta.value)}`, '_blank', 'noopener'); }
      };
      step();
    });
  },

  research(body) {
    const SUGG = ['how to be more productive (but fun)', 'digital nomad tools', 'best creator setup 2026', 'internet culture trends', 'how cows take over the internet', 'is $COW the most online coin', 'what is a memecoin', 'how to buy $COW on solana'];
    const DB = [
      { k: /productive|fun/, r: [['Open 40 tabs. Close none.', 'Peer reviewed by COW. Productivity +248%.'], ['Work from the pasture, post from the laptop.', 'The COW method™.']] },
      { k: /nomad|setup|creator/, r: [['The 2026 setup: one laptop, one cow sticker, infinite wifi.', 'Hardware optional. Being online mandatory.'], ['Ring light? No. Screen glow is the ring light.', 'As seen on COW\'s face.']] },
      { k: /trend|culture/, r: [['"Still online" is the new "be right back".', 'Nobody is coming back. Nobody left.'], ['Memecoins are the folk art of the internet.', 'And $COW is the folk hero.']] },
      { k: /cow|take over/, r: [['Step 1: get a laptop. Step 2: never close it.', 'Step 3: $COW.'], ['Cows have 4 stomachs. COW has 4 monitors.', 'Correlation is causation when you are online enough.']] },
      { k: /\$?cow|coin|online/, r: [['$COW: Chronically On Web', 'Solana memecoin. 1B supply. 0% tax. LP burned. Uptime: 100%.'], ['Tokenomics', `Supply ${TOKEN.supply} · tax 0/0 · mint revoked · freeze revoked.`]] },
      { k: /buy|solana|how/, r: [['How to buy $COW', 'Phantom wallet → get SOL → swap on Jupiter → stay online.'], ['Where is the CA?', TOKEN.ca || 'Dropping at launch. COW is researching the perfect timing.']] },
      { k: /memecoin|what is/, r: [['What is a memecoin?', 'A coin powered by community, culture and an unreasonable amount of posting.'], ['Is it serious?', 'No. That is the point. See disclaimer. Then see the cow.']] },
    ];
    body.innerHTML = `<div class="app-toolbar"><input placeholder="search the entire internet (cow edition)" /><button class="app-btn">${ic('search')} Go</button></div>
      <ul class="sugg" style="margin-bottom:.5rem">${SUGG.map((s) => `<li>${s}</li>`).join('')}</ul><div class="results"></div>`;
    const input = body.querySelector('input'), results = body.querySelector('.results');
    const run = (q) => {
      input.value = q;
      const t = q.toLowerCase();
      let hit = DB.find((d) => d.k.test(t));
      const rows = hit ? hit.r : [['No results. COW opened 3 new tabs anyway.', 'Try: productive, setup, trends, cows, $COW, buy.']];
      results.innerHTML = `<div class="muted small mono">about 1,000,000,000 results (0.00 seconds, cow is fast)</div>` + rows.map((r) => `<div class="result"><b>${r[0]}</b><small>${r[1]}</small></div>`).join('');
      liveCow.play('type');
    };
    body.querySelectorAll('.sugg li').forEach((li) => li.addEventListener('click', () => run(li.textContent)));
    body.querySelector('.app-btn').addEventListener('click', () => input.value.trim() && run(input.value.trim()));
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && input.value.trim()) run(input.value.trim()); });
  },

  overthink(body, app) {
    const THOUGHTS = [
      'did i buy the top?', 'what if the chart is just… a drawing?', 'is 247 tabs a personality?', 'what if everyone logs off at the same time and the internet is empty',
      'should i post that? i should post that. should i though?', 'red candle = the universe is personally mad at me', 'wen moon? what if moon is already here and i missed it',
      'i blinked for 0.3s. what did i miss', 'do cows dream of electric pastures', 'is "gm" still cool or am i the only one saying it', 'what if the dip dips', 'i should sleep. counterpoint: wifi.',
      'if i refresh dexscreener a 400th time, will it change?', 'the sticker on my laptop is a cow. am i the sticker?', 'what if touching grass is a psyop', 'i have been researching for 6 hours. what was the question',
      'did the chat see me wave? did they like it? was it too much?', 'is "still online" a flex or a diagnosis', 'what if it goes up and i am not online to see it (impossible)', 'moo. (anxious)',
    ];
    body.innerHTML = `<p class="muted" style="margin:0 0 .4rem">Press the button. COW will take it from here.</p>
      <div class="app-toolbar" style="margin:0"><button class="app-btn pink start">${ic('spiral')} Start overthinking</button><button class="app-btn alt grass">${ic('leaf')} Touch grass</button></div>
      <div class="meter"><i></i></div><div class="muted small mono lvl">overthink level: 0%</div><div class="thoughts"></div>`;
    const thoughts = body.querySelector('.thoughts'), meter = body.querySelector('.meter i'), lvl = body.querySelector('.lvl');
    let level = 0, timer = null;
    const spawn = () => {
      const t = document.createElement('div'); t.className = 'thought'; t.textContent = rand(THOUGHTS);
      thoughts.prepend(t); while (thoughts.children.length > 8) thoughts.lastChild.remove();
      level = Math.min(100, level + 9 + Math.random() * 8);
      meter.style.width = level + '%'; lvl.textContent = `overthink level: ${Math.round(level)}%`;
      if (level >= 100) { clearInterval(timer); timer = null; lvl.textContent = 'overthink level: 100% — COW has achieved enlightenment (still online)'; liveCow.play('spin'); }
      else if (Math.random() < 0.3) liveCow.play(rand(['lookaround', 'shake', 'earflick']));
    };
    body.querySelector('.start').addEventListener('click', () => { if (timer) return; spawn(); timer = setInterval(spawn, 900); });
    body.querySelector('.grass').addEventListener('click', () => {
      clearInterval(timer); timer = null; level = 0; meter.style.width = '0%'; lvl.textContent = 'overthink level: 0% — grass touched (through a screen)';
      thoughts.innerHTML = `<div class="thought" style="border-color:rgba(62,242,179,.4);background:rgba(62,242,179,.08)">${ic('leaf', 'green')} ok. breathing. opening one (1) tab about grass.</div>`;
      liveCow.play('happy');
    });
    app.cleanup = () => clearInterval(timer);
  },

  online(body, app) {
    body.innerHTML = `<div style="display:flex;align-items:center;gap:.6rem"><i class="dot" style="width:12px;height:12px;border-radius:50%;background:var(--green);box-shadow:0 0 14px var(--green);display:inline-block"></i><b>COW is online</b><span class="muted small mono" data-utc></span></div>
      <div class="kv">
        <div><b data-uptime>0d 00:00:00</b><span>current online streak</span></div>
        <div><b>never</b><span>last seen offline</span></div>
        <div><b class="tabs">247</b><span>tabs open</span></div>
        <div><b class="ping">12 ms</b><span>ping to the internet</span></div>
        <div><b>∞</b><span>days since touching grass</span></div>
        <div><b class="coffee">${ic('coffee')} × 9</b><span>coffee consumed</span></div>
      </div>
      <div class="app-toolbar" style="margin:.6rem 0 0"><button class="app-btn">${ic('radio')} Ping COW</button><button class="app-btn alt tab">${ic('plus')} open tab</button></div><div class="muted small mono log" style="margin-top:.4rem"></div>`;
    const log = body.querySelector('.log'), tabs = body.querySelector('.tabs'), ping = body.querySelector('.ping'), coffee = body.querySelector('.coffee');
    let nTabs = 247, nCoffee = 9;
    body.querySelector('.app-btn').addEventListener('click', () => { const ms = 8 + Math.floor(Math.random() * 20); ping.textContent = ms + ' ms'; log.textContent = `PING cow… 64 bytes: time=${ms}ms — reply: "moo, still here"`; liveCow.play('wave'); });
    body.querySelector('.tab').addEventListener('click', () => { nTabs++; tabs.textContent = nTabs; log.textContent = `opened tab #${nTabs}: "is ${nTabs} tabs too many"`; });
    const iv = setInterval(() => { if (Math.random() < 0.5) { nTabs++; tabs.textContent = nTabs; } if (Math.random() < 0.15) { nCoffee++; coffee.innerHTML = `${ic('coffee')} × ${nCoffee}`; } }, 4000);
    app.cleanup = () => clearInterval(iv);
    tickClocks();
  },

  analytics(body, app) {
    body.innerHTML = `<canvas class="chart-canvas" width="400" height="150"></canvas>
      <div class="kv">
        <div><b class="pct green">+0%</b><span>vibes (30d)</span></div>
        <div><b>100%</b><span>uptime</span></div>
        <div><b class="posts">0</b><span>posts today</span></div>
        <div><b>1 / 1</b><span>cows online</span></div>
      </div>`;
    const cv = body.querySelector('canvas'), ctx = cv.getContext('2d'), pct = body.querySelector('.pct'), posts = body.querySelector('.posts');
    const pts = [50, 42, 46, 30, 36, 18, 24, 12, 16, 6];
    let p = 0; const start = performance.now();
    const draw = (now) => {
      p = Math.min(1, (now - start) / 1600);
      ctx.clearRect(0, 0, 400, 150);
      ctx.strokeStyle = 'rgba(90,140,255,.15)';
      for (let y = 20; y < 150; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(400, y); ctx.stroke(); }
      const n = Math.max(2, Math.ceil(pts.length * p));
      ctx.beginPath(); ctx.lineWidth = 3; ctx.strokeStyle = '#3ef2b3'; ctx.lineJoin = 'round'; ctx.shadowColor = 'rgba(62,242,179,.6)'; ctx.shadowBlur = 10;
      for (let i = 0; i < n; i++) { const x = 10 + (i * 380) / (pts.length - 1), y = 15 + pts[i] * 2.3; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke(); ctx.shadowBlur = 0;
      pct.textContent = `+${Math.round(248 * p)}%`; posts.textContent = Math.round(137 * p);
      if (p < 1) app.raf = requestAnimationFrame(draw);
    };
    app.raf = requestAnimationFrame(draw);
    app.cleanup = () => cancelAnimationFrame(app.raf);
  },

  terminal(body) {
    body.innerHTML = `<div class="term"><div class="ok">COW OS v2.4.8 — type <b>help</b></div><div><span class="in">cow@web:~$</span> echo $MOOD</div><div class="ok">INTERNET = HAPPY PLACE &lt;3</div></div>
      <form class="term-form"><span>cow@web:~$</span><input autocomplete="off" spellcheck="false" /></form>`;
    const term = body.querySelector('.term'), form = body.querySelector('form'), input = body.querySelector('input');
    const out = (html, cls = '') => { const d = document.createElement('div'); if (cls) d.className = cls; d.innerHTML = html; term.appendChild(d); term.scrollTop = term.scrollHeight; body.scrollTop = body.scrollHeight; };
    const CMDS = {
      help: () => out('commands: help, gm, moo, ca, buy, socials, status, uptime, wave, dance, wink, jump, spin, tabs, grass, clear', 'ok'),
      gm: () => { out('gm — already online for 19 hours'); liveCow.play('wave'); },
      moo: () => { out(rand(['moo.', 'MOO.', 'moo? moo.', 'm o o'])); liveCow.play('nod'); },
      ca: () => out(TOKEN.ca ? `CA: ${TOKEN.ca}` : 'CA: TBA — dropping at launch. stay online.', 'ok'),
      buy: () => out(`1) phantom wallet 2) get SOL 3) swap on jupiter → ${TOKEN.links.buy} 4) never log off`, 'ok'),
      socials: () => out(`x: ${TOKEN.links.x}<br>tg: ${TOKEN.links.telegram}<br>dex: ${TOKEN.links.dex}`, 'ok'),
      status: () => out('status: ONLINE · mood: happy · tabs: 247 · grass: untouched', 'ok'),
      uptime: () => out(`uptime: ${$('#statUptime').textContent} (and counting)`, 'ok'),
      wave: () => { liveCow.play('wave'); out('o/'); }, dance: () => { liveCow.play('dance'); out('dancing…'); }, wink: () => { liveCow.play('wink'); out(';)'); },
      jump: () => { liveCow.play('jump'); out('boing'); }, spin: () => { liveCow.play('spin'); out('spinning…'); },
      tabs: () => out('247 tabs open. closing 0. opening 3.'),
      grass: () => out('error: grass not found. did you mean: wifi?', 'err'),
      sudo: () => out('cow is not in the sudoers file. this incident will be posted.', 'err'),
      clear: () => (term.innerHTML = ''),
      whoami: () => out('chronically_online_user'),
      ls: () => out('ideas/  content/  research/  posts/  overthinking/  still_online.txt'),
    };
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const cmd = input.value.trim(); if (!cmd) return; input.value = '';
      out(`<span class="in">cow@web:~$</span> ${esc(cmd)}`);
      const key = cmd.toLowerCase().split(/\s+/)[0];
      (CMDS[key] || (() => out(`command not found: ${esc(key)} — try help`, 'err')))();
    });
    body.addEventListener('click', () => input.focus());
    setTimeout(() => input.focus(), 50);
  },
};

// open a couple of apps on first scroll into view
const osObserver = new IntersectionObserver((en) => {
  if (en[0].isIntersecting) { openApp('online'); setTimeout(() => openApp('browse'), 400); osObserver.disconnect(); }
}, { threshold: 0.35 });
osObserver.observe(desktop);

// keep windows inside when the desktop resizes
window.addEventListener('resize', () => {
  apps.forEach((a) => { const max = Math.max(0, winLayer.clientWidth - 100); if (a.el.offsetLeft > max) a.el.style.left = max + 'px'; });
});
