const $c = document.getElementById('console');
const $i = document.getElementById('in');
const $send = document.getElementById('send');
const hist = [];
let idx = -1;

function appendText(t) {
  if (!t) return;
  $c.textContent += t;
  $c.scrollTop = $c.scrollHeight;
}

async function firstRender() {
  const res = await fetch('/api/state', { cache: 'no-store' });
  appendText(await res.text());
}

function getMeta(name){
  const el = document.querySelector(`meta[name="${name}"]`);
  return el ? el.content : null;
}

async function send(cmd) {
  const token = getMeta('csrf-token');
  const res = await fetch('/api/command', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Csrf-Token': token,
      'X-CSRF-TOKEN': token
    },
    credentials: 'same-origin',
    body: JSON.stringify({ command: cmd })
  });
  const text = await res.text();
  if (!res.ok) appendText(`\n[ERROR ${res.status}] ${text}\n`);
  else appendText(text);
}

$send.onclick = () => {
  const v = $i.value.trim(); if (!v) return;
  hist.push(v); idx = hist.length; $i.value = '';
  send(v);
};

$i.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { e.preventDefault(); $send.click(); }
  else if (e.key === 'ArrowUp')   { if (hist.length && idx > 0) { idx--; $i.value = hist[idx]; } }
  else if (e.key === 'ArrowDown') { if (hist.length && idx < hist.length - 1) { idx++; $i.value = hist[idx]; } else { idx = hist.length; $i.value = ''; } }
});

try {
  const es = new EventSource('/api/stream');
  es.onmessage = (e) => appendText(e.data + "\n");
} catch (_) {
  (async function poll() {
    try {
      const r = await fetch('/api/state', { cache: 'no-store' });
      appendText(await r.text());
    } finally {
      setTimeout(poll, 400);
    }
  })();
}

firstRender();
