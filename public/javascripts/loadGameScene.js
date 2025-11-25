import { createSoundManager } from './utils/soundManager.js';
import { fileIOApi } from './api/FileIOApi.js';

export async function build({ api, push, overlay, createGameAlert }) {
  const soundManager = createSoundManager({ basePath: '/assets/sounds/' });
  soundManager.preload('hover', 'hover.wav');
  soundManager.preload('click', 'attack.wav');
  
  const $root = $('.scene--loadgame');
  const $container = $root.find('.container');
  if (!$root.length || !$container.length) return { destroy() {}, refresh: async () => {} };

  const listUrl    = $root.data('list-url')   || '/api/files/list';
  const loadUrl    = $root.data('load-url')   || '/api/files/load';
  const redirectTo = $root.data('redirect')   || '/playing-field';
  const $messagesEl     = $root.find('.loadgame-messages');
  const $globalLoadBtn  = $root.find('.load-game-btn');

  let selectedGameId = null;

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

  function announce(msg, type = 'info') {
    if (!$messagesEl.length) return;
    const $div = $('<div>')
      .addClass(`msg msg--${type}`)
      .text(msg);
    $messagesEl.empty().append($div);
    setTimeout(() => {
      $div.fadeOut(400, function() { $(this).remove(); });
    }, 4000);
  }

  function renderList(items = []) {
    $container.empty();
    selectedGameId = null;
    
    if ($globalLoadBtn.length) {
      $globalLoadBtn
        .addClass('disabled')
        .css({ 'pointer-events': 'none', 'opacity': '0.5' });
    }

    if (!items.length) {
      const $empty = $('<p>')
        .addClass('empty-note')
        .text('No saved games found.');
      $container.append($empty);
      return;
    }

    const $list = $('<div>').addClass('save-list');

    $.each(items, function(index, fileName) {
      const name = fileName;
      const id   = fileName;
      const when = null;

      const $card = $('<div>')
        .addClass('save-card')
        .css('cursor', 'pointer')
        .data('game-id', id);

      const $header = $('<div>')
        .addClass('save-card__header')
        .html(`<strong class="save-title">${name}</strong>`);

      const $meta = $('<div>')
        .addClass('save-card__meta')
        .text(when ? `Updated: ${fmtDate(when)}` : '');

      $card.on('mouseenter', function() {
        soundManager.play('hover', { volume: 0.3 });
      });

      $card.on('click', function() {
        soundManager.play('click', { volume: 0.6 });
        
        $list.find('.save-card').removeClass('selected');
        $card.addClass('selected');
        selectedGameId = id;
        
        if ($globalLoadBtn.length) {
          $globalLoadBtn
            .removeClass('disabled')
            .css({ 'pointer-events': 'auto', 'opacity': '1' });
        }
        
        announce(`Selected: ${name}`, 'info');
      });

      $card.append($header, $meta);
      $list.append($card);
    });

    $container.append($list);
  }

  async function fetchAndRender() {
    $.ajax({
      url: listUrl,
      method: 'GET',
      dataType: 'json',
      success: function(data) {
        const files = Array.isArray(data) ? data : (data.files || []);
        renderList(files);
        announce(`Found ${files.length} saved game${files.length !== 1 ? 's' : ''}`, 'info');
      },
      error: function(jqXHR, textStatus, errorThrown) {
        announce('Could not fetch saved games.', 'error');
        renderList([]);
      }
    });
  }

  function setLoadBusy(busy) {
    if (!$globalLoadBtn.length) return;
    const $btn = $globalLoadBtn;
    if (busy) {
      $btn.addClass('disabled').css('pointer-events', 'none');
    } else {
      $btn.removeClass('disabled').css('pointer-events', selectedGameId ? 'auto' : 'none');
    }
  }

  if ($globalLoadBtn.length) {
    $globalLoadBtn.on('mouseenter', function() {
      if (!$(this).hasClass('disabled')) {
        soundManager.play('hover', { volume: 0.3 });
      }
    });

    $globalLoadBtn.on('click', async function(e) {
      e.preventDefault();
      
      if (!selectedGameId || $(this).hasClass('disabled')) {
        announce('Please select a game to load.', 'error');
        return;
      }

      soundManager.play('click', { volume: 0.6 });
      
      const $btn = $(this);
      const originalText = $btn.text();
      $btn.text('Loading...');
      setLoadBusy(true);
      
      if (push && typeof push.load === 'function') {
        try {
          push.load(selectedGameId);
          announce(`Loading via server push: ${selectedGameId}`, 'info');
        } catch (err) {
          console.error('Push load failed:', err);
          announce('Could not load game via server push.', 'error');
          $btn.text(originalText);
          setLoadBusy(false);
        }
        return;
      }

      try {
        const sessionId = await fileIOApi.resolveSessionId();
        const csrfToken = $('meta[name="csrf-token"]').attr('content');
        
        $.ajax({
          url: loadUrl,
          method: 'POST',
          contentType: 'application/json',
          dataType: 'json',
          headers: csrfToken ? {
            'Csrf-Token': csrfToken,
            'X-CSRF-Token': csrfToken
          } : {},
          data: JSON.stringify({ 
            fileName: selectedGameId, 
            sessionId: sessionId 
          }),
          success: function(response) {
            announce(`Successfully loaded: ${selectedGameId}`, 'success');
            
            if (response.gameState) {
              updateGameDataDisplay(response.gameState);
            }
            
            setTimeout(function() { 
              window.location.href = redirectTo; 
            }, 800);
          },
          error: function(jqXHR, textStatus, errorThrown) {
            const errorMsg = jqXHR.responseText || 'Failed to load the selected game.';
            announce(errorMsg, 'error');
            
            $btn.text(originalText);
            setLoadBusy(false);
          }
        });
      } catch (err) {
        announce('An error occurred while loading the game.', 'error');
        $btn.text(originalText);
        setLoadBusy(false);
      }
    });
  }

  function updateGameDataDisplay(gameState) {
    if (!gameState) return;
    
    const $preview = $('<div>')
      .addClass('game-preview')
      .html(`
        <h3>Game Preview</h3>
        <div class="preview-content">
          ${gameState.currentScene ? `<p><strong>Scene:</strong> ${gameState.currentScene}</p>` : ''}
          ${gameState.players ? `<p><strong>Players:</strong> ${gameState.players.length}</p>` : ''}
          ${gameState.round ? `<p><strong>Round:</strong> ${gameState.round}</p>` : ''}
        </div>
      `);
    
    $('.game-preview').remove();
    $container.before($preview);
  }

  await fetchAndRender();

  return {
    destroy() {
      $container.empty();
      $globalLoadBtn.off('mouseenter click');
    },
    refresh: fetchAndRender,
  };
}
