
export const ajaxHelper = {
 
  getCsrfToken() {
    return $('meta[name="csrf-token"]').attr('content');
  },


  get(url, params = {}) {
    return $.ajax({
      url: url,
      method: 'GET',
      data: params,
      dataType: 'json',
      cache: false
    });
  },


  post(url, data = {}) {
    const csrfToken = this.getCsrfToken();
    
    return $.ajax({
      url: url,
      method: 'POST',
      contentType: 'application/json',
      dataType: 'json',
      headers: csrfToken ? {
        'Csrf-Token': csrfToken,
        'X-CSRF-Token': csrfToken
      } : {},
      data: JSON.stringify(data)
    });
  },


  put(url, data = {}) {
    const csrfToken = this.getCsrfToken();
    
    return $.ajax({
      url: url,
      method: 'PUT',
      contentType: 'application/json',
      dataType: 'json',
      headers: csrfToken ? {
        'Csrf-Token': csrfToken,
        'X-CSRF-Token': csrfToken
      } : {},
      data: JSON.stringify(data)
    });
  },


  delete(url, data = {}) {
    const csrfToken = this.getCsrfToken();
    
    return $.ajax({
      url: url,
      method: 'DELETE',
      contentType: 'application/json',
      dataType: 'json',
      headers: csrfToken ? {
        'Csrf-Token': csrfToken,
        'X-CSRF-Token': csrfToken
      } : {},
      data: JSON.stringify(data)
    });
  },

  fetchGameState(url, updateCallback) {
    return this.get(url)
      .done(function(gameState) {
        console.log('Game state received:', gameState);
        if (typeof updateCallback === 'function') {
          updateCallback(gameState);
        }
      })
      .fail(function(jqXHR, textStatus, errorThrown) {
        console.error('Failed to fetch game state:', textStatus, errorThrown);
      });
  },


  saveGameState(url, gameState, successCallback, errorCallback) {
    return this.post(url, gameState)
      .done(function(response) {
        console.log('Game saved successfully:', response);
        if (typeof successCallback === 'function') {
          successCallback(response);
        }
      })
      .fail(function(jqXHR, textStatus, errorThrown) {
        console.error('Failed to save game:', textStatus, errorThrown);
        if (typeof errorCallback === 'function') {
          errorCallback(jqXHR, textStatus, errorThrown);
        }
      });
  },


  pollGameUpdates(url, interval, updateCallback) {
    const self = this;
    return setInterval(function() {
      self.get(url)
        .done(function(data) {
          if (typeof updateCallback === 'function') {
            updateCallback(data);
          }
        })
        .fail(function(jqXHR, textStatus, errorThrown) {
          console.error('Polling failed:', textStatus, errorThrown);
        });
    }, interval);
  },

  stopPolling(intervalId) {
    clearInterval(intervalId);
  }
};

export const uiUpdater = {
 
  updatePlayerData(playerData, selector = '.player-info') {
    const $container = $(selector);
    if (!$container.length || !playerData) return;

    $container.empty();

    $.each(playerData, function(index, player) {
      const $playerCard = $('<div>')
        .addClass('player-card')
        .attr('data-player-id', player.id)
        .html(`
          <div class="player-name">${player.name || 'Unknown'}</div>
          <div class="player-score">Score: ${player.score || 0}</div>
          <div class="player-cards">Cards: ${player.cards?.length || 0}</div>
        `);
      
      $container.append($playerCard);
    });
  },


  updateScores(scoresData, selector = '.scores-display') {
    const $container = $(selector);
    if (!$container.length || !scoresData) return;

    $.each(scoresData, function(playerId, score) {
      const $scoreElement = $container.find(`[data-player-id="${playerId}"] .player-score`);
      if ($scoreElement.length) {
        const currentScore = parseInt($scoreElement.text().replace(/\D/g, '')) || 0;
        
        // Animate score change
        $({ score: currentScore }).animate(
          { score: score },
          {
            duration: 1000,
            step: function(now) {
              $scoreElement.text('Score: ' + Math.floor(now));
            },
            complete: function() {
              $scoreElement.addClass('score-updated').delay(500).queue(function() {
                $(this).removeClass('score-updated').dequeue();
              });
            }
          }
        );
      }
    });
  },

  
  updateCards(cardsData, selector = '.cards-container') {
    const $container = $(selector);
    if (!$container.length || !cardsData) return;

    $container.empty().fadeOut(200, function() {
      $.each(cardsData, function(index, card) {
        const $card = $('<div>')
          .addClass('game-card')
          .attr('data-card-id', card.id)
          .html(`
            <div class="card-image">
              <img src="${card.imageUrl || '/assets/images/cards/default.png'}" alt="${card.name}">
            </div>
            <div class="card-name">${card.name || 'Unknown'}</div>
            <div class="card-stats">
              <span class="attack">${card.attack || 0}</span>
              <span class="defense">${card.defense || 0}</span>
            </div>
          `)
          .hide();
        
        $container.append($card);
      });

      $container.fadeIn(200);
      $container.find('.game-card').each(function(index) {
        $(this).delay(index * 100).fadeIn(300);
      });
    });
  },


  showNotification(message, type = 'info', duration = 3000) {
    const $notification = $('<div>')
      .addClass(`notification notification--${type}`)
      .text(message)
      .hide();

    $('body').append($notification);

    $notification.fadeIn(300).delay(duration).fadeOut(300, function() {
      $(this).remove();
    });
  },

 
  updateGameState(gameState) {
    if (!gameState) return;

    // Update players
    if (gameState.players) {
      this.updatePlayerData(gameState.players);
    }

    // Update scores
    if (gameState.scores) {
      this.updateScores(gameState.scores);
    }

    // Update current scene/phase
    if (gameState.currentScene) {
      $('.game-phase').text(gameState.currentScene);
    }

    // Update round number
    if (gameState.round) {
      $('.round-number').text(`Round: ${gameState.round}`);
    }

    // Update cards if available
    if (gameState.currentPlayerCards) {
      this.updateCards(gameState.currentPlayerCards);
    }
  }
};
