// /assets/javascripts/multiplayerScene.js

export async function build({ api, overlay, createGameAlert }) {
  const root   = document.querySelector('.scene--create-multiplayer');
  const form   = root?.querySelector('form');
  const p1     = root?.querySelector('input[name="player1"]');
  const p2     = root?.querySelector('input[name="player2"]');
  const btnOk  = root?.querySelector('button[type="submit"]');
  const btnBack = root?.querySelector('a.gbtn.gbtn--secondary');

  const trim = (el) => (el?.value ?? '').trim();
  const setBusy = (busy) => {
    btnOk?.classList.toggle('is-busy', !!busy);
    btnOk && (btnOk.disabled = !!busy);
    p1 && (p1.disabled = !!busy);
    p2 && (p2.disabled = !!busy);
  };

  function showAlert(msg) {
    if (overlay && createGameAlert) {
      const el = createGameAlert({ message: msg });
      overlay.show(el, { onHide: () => el.cleanup?.() });
    } else {
      alert(msg);
    }
  }


  function validate() {
    const v1 = trim(p1);
    const v2 = trim(p2);

    if (!v1 || !v2) {
      showAlert('Please enter both player names.');
      return false;
    }
    if (v1.length > 40 || v2.length > 40) {
      showAlert('Names should be 40 characters or fewer.');
      return false;
    }
    return true;
  }

  function onSubmit(e) {
    if (!validate()) {
      e.preventDefault();
      return false;
    }
    setBusy(true);
    return true;
  }

  function onKeyDown(e) {
    if (e.key === 'Enter') {
    }
  }

  form?.addEventListener('submit', onSubmit);
  p1?.addEventListener('keydown', onKeyDown);
  p2?.addEventListener('keydown', onKeyDown);

  return {
    destroy() {
      form?.removeEventListener('submit', onSubmit);
      p1?.removeEventListener('keydown', onKeyDown);
      p2?.removeEventListener('keydown', onKeyDown);
      setBusy(false);
    },
    refresh: async () => {},
  };
}
