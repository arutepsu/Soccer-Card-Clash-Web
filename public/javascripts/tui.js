const $c = document.getElementById('console');
const $i = document.getElementById('in');
const $send = document.getElementById('send');
const hist = [];
let idx = -1;

function setText(t){
  $c.textContent = t || '';
  $c.scrollTop = $c.scrollHeight;
}

async function render() {
  const res = await fetch('/api/state');
  setText(await res.text());
}

async function send(cmd) {
  const res = await fetch('/api/command', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Csrf-Token': CSRF_TOKEN   // <-- important
    },
    body: JSON.stringify({ command: cmd })
  });
  setText(await res.text());
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

// live updates (reflect AI/events)
try {
  const es = new EventSource('/api/stream');
  es.onmessage = (e) => setText(e.data);
} catch (_) {}

render();
