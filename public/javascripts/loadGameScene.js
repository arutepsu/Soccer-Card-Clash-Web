export async function build({ api, overlay, createGameAlert }) {
  const root = document.querySelector('.scene--loadgame');
  const container = root?.querySelector('.container');
  if (!root || !container) return { destroy() {}, refresh: async () => {} };

  // Optional data attributes on the root (nice to have)
  // <div class="scene scene--loadgame"
  //      data-list-url="/api/saves" data-load-url="/api/load" data-redirect="/playing-field">
  const listUrl = root.dataset.listUrl || '/api/saves';
  const loadUrl = root.dataset.loadUrl || '/api/load';
  const redirectTo = root.dataset.redirect || '/playing-field';

  function showAlert(msg) {
    if (overlay && createGameAlert) {
      const el = createGameAlert({ message: msg });
      overlay.show(el, { onHide: () => el.cleanup?.() });
    } else {
      alert(msg);
    }
  }

  function fmtDate(iso) {
    try { return new Date(iso).toLocaleString(); } catch { return iso || ''; }
  }

  function renderList(items = []) {
    container.innerHTML = '';
    if (!items.length) {
      const empty = document.createElement('p');
      empty.className = 'empty-note';
      empty.textContent = 'No saved games found.';
      container.appendChild(empty);
      return;
    }

    const list = document.createElement('div');
    list.className = 'save-list';

    items.forEach((it) => {
      // expect shape like { id, name, updatedAt } – tolerate variations
      const id   = it.id ?? it.saveId ?? it.name ?? String(Math.random());
      const name = it.name ?? it.title ?? `Save ${id}`;
      const when = it.updatedAt ?? it.createdAt ?? it.timestamp ?? null;

      const card = document.createElement('div');
      card.className = 'save-card';

      const header = document.createElement('div');
      header.className = 'save-card__header';
      header.innerHTML = `<strong class="save-title">${name}</strong>`;

      const meta = document.createElement('div');
      meta.className = 'save-card__meta';
      meta.textContent = when ? `Updated: ${fmtDate(when)}` : '';

      const actions = document.createElement('div');
      actions.className = 'save-card__actions';

      const btnLoad = document.createElement('button');
      btnLoad.type = 'button';
      btnLoad.className = 'gbtn';
      btnLoad.textContent = 'Load';
      btnLoad.addEventListener('click', async () => {
        try {
          // POST { id } to load the save, then go to playing field
          await api.postJSON(loadUrl, { id });
          window.location.href = redirectTo;
        } catch (e) {
          console.error(e);
          showAlert('Failed to load the selected game.');
        }
      });

      actions.appendChild(btnLoad);
      card.append(header, meta, actions);
      list.appendChild(card);
    });

    container.appendChild(list);
  }

  async function fetchAndRender() {
    try {
      const items = await api.getJSON(listUrl);
      // Accept either { saves: [...] } or [...]
      renderList(Array.isArray(items) ? items : (items?.saves ?? []));
    } catch (e) {
      console.error(e);
      showAlert('Could not fetch saved games.');
      renderList([]);
    }
  }

  await fetchAndRender();

  return {
    destroy() {
      // remove all listeners by nuking the container content
      container.innerHTML = '';
    },
    refresh: fetchAndRender,
  };
}
