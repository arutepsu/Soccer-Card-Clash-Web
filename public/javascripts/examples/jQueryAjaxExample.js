import { ajaxHelper, uiUpdater } from '../utils/jQueryAjaxHelper.js';

export function initializeAjaxExample() {
  console.log('Initializing jQuery Ajax Example...');

  function fetchGameList() {
    console.log('Fetching game list...');
    
    ajaxHelper.get('/api/files/list')
      .done(function(data) {
        console.log('✅ Successfully received game list:', data);
        displayGameList(data);
      })
      .fail(function(jqXHR, textStatus, errorThrown) {
        console.error('❌ Failed to fetch game list:', textStatus, errorThrown);
        uiUpdater.showNotification('Failed to load games', 'error');
      });
  }

  function loadGame(fileName, sessionId) {
    console.log(`Loading game: ${fileName}`);
    
    const gameData = {
      fileName: fileName,
      sessionId: sessionId
    };

    ajaxHelper.post('/api/files/load', gameData)
      .done(function(response) {
        console.log('✅ Game loaded successfully:', response);
        
        // Update UI with loaded game data
        if (response.gameState) {
          uiUpdater.updateGameState(response.gameState);
          uiUpdater.showNotification(`Loaded: ${fileName}`, 'success');
        }
      })
      .fail(function(jqXHR, textStatus, errorThrown) {
        console.error('❌ Failed to load game:', textStatus, errorThrown);
        uiUpdater.showNotification('Failed to load game', 'error');
      });
  }

  function saveGame(gameState) {
    console.log('Saving game state...');
    
    ajaxHelper.post('/api/files/save', gameState)
      .done(function(response) {
        console.log('Game saved successfully:', response);
        uiUpdater.showNotification('Game saved!', 'success');
      })
      .fail(function(jqXHR, textStatus, errorThrown) {
        console.error('❌ Failed to save game:', textStatus, errorThrown);
        uiUpdater.showNotification('Failed to save game', 'error');
      });
  }

  let pollingInterval = null;

  function startGameStatePolling(gameId) {
    console.log('Starting game state polling...');
    
    // Poll every 5 seconds
    pollingInterval = ajaxHelper.pollGameUpdates(
      `/api/game/${gameId}/state`,
      5000,
      function(gameState) {
        console.log('📡 Received game state update:', gameState);
        uiUpdater.updateGameState(gameState);
      }
    );
  }

  function stopGameStatePolling() {
    if (pollingInterval) {
      console.log('Stopping game state polling...');
      ajaxHelper.stopPolling(pollingInterval);
      pollingInterval = null;
    }
  }

  function displayGameList(games) {
    const $container = $('.games-list-container');
    if (!$container.length) {
      console.warn('Games list container not found');
      return;
    }

    $container.empty();

    const gameFiles = Array.isArray(games) ? games : (games.files || []);

    if (gameFiles.length === 0) {
      $container.html('<p class="empty-message">No saved games found</p>');
      return;
    }

    const $list = $('<ul>').addClass('games-list');

    $.each(gameFiles, function(index, fileName) {
      const $item = $('<li>')
        .addClass('game-item')
        .html(`
          <span class="game-name">${fileName}</span>
          <button class="btn-load-game" data-filename="${fileName}">Load</button>
        `)
        .hide();

      $list.append($item);
    });

    $container.append($list);

    $('.game-item').each(function(index) {
      $(this).delay(index * 50).fadeIn(200);
    });

    $('.btn-load-game').on('click', function() {
      const fileName = $(this).data('filename');
      loadGame(fileName, 'session-123'); // Replace with actual session ID
    });
  }

  function setupSaveGameForm() {
    $('#save-game-form').on('submit', function(e) {
      e.preventDefault();
      
      const formData = {
        fileName: $('#game-name').val(),
        gameState: {
          currentScene: $('#current-scene').val(),
          players: JSON.parse($('#players-data').val() || '[]'),
          round: parseInt($('#round-number').val()) || 1
        }
      };

      console.log('Submitting form data:', formData);

      ajaxHelper.post('/api/files/save', formData)
        .done(function(response) {
          console.log('Form submitted successfully:', response);
          uiUpdater.showNotification('Game saved successfully!', 'success');
          $('#save-game-form')[0].reset();
        })
        .fail(function(jqXHR, textStatus, errorThrown) {
          console.error(' Form submission failed:', textStatus, errorThrown);
          uiUpdater.showNotification('Failed to save game', 'error');
        });
    });
  }

  function complexAjaxFlow(gameId) {
    console.log('Starting complex Ajax flow...');

    // First load the game
    ajaxHelper.get(`/api/game/${gameId}`)
      .done(function(gameData) {
        console.log('Step 1: Game loaded', gameData);
        
        return ajaxHelper.post(`/api/game/${gameId}/update`, {
          action: 'START_ROUND',
          round: gameData.round + 1
        });
      })
      .done(function(updateResponse) {
        console.log('Step 2: Game updated', updateResponse);
        
        return ajaxHelper.get(`/api/game/${gameId}/state`);
      })
      .done(function(finalState) {
        console.log('Step 3: Final state received', finalState);
        uiUpdater.updateGameState(finalState);
        uiUpdater.showNotification('Game flow completed!', 'success');
      })
      .fail(function(jqXHR, textStatus, errorThrown) {
        console.error('❌ Ajax flow failed:', textStatus, errorThrown);
        uiUpdater.showNotification('Operation failed', 'error');
      });
  }

  function loadMultipleResources() {
    console.log('Loading multiple resources...');

    const request1 = ajaxHelper.get('/api/players');
    const request2 = ajaxHelper.get('/api/cards');
    const request3 = ajaxHelper.get('/api/game/current');

    $.when(request1, request2, request3)
      .done(function(playersResponse, cardsResponse, gameResponse) {
        console.log('✅ All resources loaded:');
        console.log('Players:', playersResponse[0]);
        console.log('Cards:', cardsResponse[0]);
        console.log('Game:', gameResponse[0]);

        // Update UI with all data
        uiUpdater.updatePlayerData(playersResponse[0]);
        uiUpdater.updateCards(cardsResponse[0]);
        
        uiUpdater.showNotification('All resources loaded!', 'success');
      })
      .fail(function() {
        console.error('❌ Failed to load one or more resources');
        uiUpdater.showNotification('Failed to load resources', 'error');
      });
  }

  return {
    fetchGameList,
    loadGame,
    saveGame,
    startGameStatePolling,
    stopGameStatePolling,
    displayGameList,
    setupSaveGameForm,
    complexAjaxFlow,
    loadMultipleResources
  };
}

$(document).ready(function() {
  console.log('jQuery Ajax Example Module loaded');

});
