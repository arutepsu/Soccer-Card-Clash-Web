import { ref, computed, onMounted } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js';
import SaveGameCard from './SaveGameCard.js';
import GameAlert from './GameAlert.js';
import { createSoundManager } from '../../utils/soundManager.js';
import { fileIOApi } from '../../api/FileIOApi.js';

export default {
  name: 'LoadGameScene',
  components: {
    SaveGameCard,
    GameAlert
  },
  setup() {
    const savedGames = ref([]);
    const selectedGameId = ref(null);
    const message = ref('');
    const messageType = ref('info');
    const isLoading = ref(false);
    const showAlert = ref(false);
    const alertMessage = ref('');

    const soundManager = createSoundManager({ basePath: '/assets/sounds/' });
    
    // Data attributes from the scene element
    const listUrl = ref('');
    const loadUrl = ref('');
    const redirectTo = ref('');

    const hasGames = computed(() => savedGames.value.length > 0);
    const canLoad = computed(() => selectedGameId.value !== null && !isLoading.value);

    onMounted(async () => {
      // Preload sounds
      soundManager.preload('hover', 'hover.wav');
      soundManager.preload('click', 'attack.wav');

      // Get URLs from data attributes
      const sceneElement = document.querySelector('.scene--loadgame');
      if (sceneElement) {
        listUrl.value = sceneElement.dataset.listUrl || '/api/files/list';
        loadUrl.value = sceneElement.dataset.loadUrl || '/api/files/load';
        redirectTo.value = sceneElement.dataset.redirect || '/playing-field';
      }

      await fetchSavedGames();
    });

    const fetchSavedGames = async () => {
      try {
        const response = await fetch(listUrl.value, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch saved games');
        }

        const data = await response.json();
        savedGames.value = Array.isArray(data) ? data : (data.files || []);
        
        announce(`Found ${savedGames.value.length} saved game${savedGames.value.length !== 1 ? 's' : ''}`, 'info');
      } catch (error) {
        console.error('Error fetching saved games:', error);
        announce('Could not fetch saved games.', 'error');
        savedGames.value = [];
      }
    };

    const selectGame = (gameId) => {
      soundManager.play('click', { volume: 0.6 });
      selectedGameId.value = gameId;
      announce(`Selected: ${gameId}`, 'info');
    };

    const loadGame = async () => {
      if (!selectedGameId.value || isLoading.value) {
        announce('Please select a game to load.', 'error');
        return;
      }

      soundManager.play('click', { volume: 0.6 });
      isLoading.value = true;

      try {
        const sessionId = await fileIOApi.resolveSessionId();
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;

        const response = await fetch(loadUrl.value, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(csrfToken && {
              'Csrf-Token': csrfToken,
              'X-CSRF-Token': csrfToken
            })
          },
          body: JSON.stringify({
            fileName: selectedGameId.value,
            sessionId: sessionId
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || 'Failed to load the selected game.');
        }

        const data = await response.json();
        announce(`Successfully loaded: ${selectedGameId.value}`, 'success');

        setTimeout(() => {
          window.location.href = redirectTo.value;
        }, 800);
      } catch (error) {
        console.error('Error loading game:', error);
        announce(error.message || 'An error occurred while loading the game.', 'error');
        isLoading.value = false;
      }
    };

    const goBack = () => {
      soundManager.play('click', { volume: 0.6 });
      // The href will handle the navigation
    };

    const announce = (msg, type = 'info') => {
      message.value = msg;
      messageType.value = type;

      setTimeout(() => {
        message.value = '';
      }, 4000);
    };

    const closeAlert = () => {
      showAlert.value = false;
      alertMessage.value = '';
    };

    return {
      savedGames,
      selectedGameId,
      message,
      messageType,
      isLoading,
      hasGames,
      canLoad,
      selectGame,
      loadGame,
      goBack,
      showAlert,
      alertMessage,
      closeAlert
    };
  },
  template: `
    <div class="scene scene--loadgame">
      <h1 class="header">Select a Saved Game</h1>

      <div class="container" aria-live="polite">
        <p v-if="!hasGames" class="empty-note">No saved games found.</p>
        <div v-else class="save-list">
          <SaveGameCard
            v-for="game in savedGames"
            :key="game"
            :gameId="game"
            :fileName="game"
            :isSelected="selectedGameId === game"
            @select="selectGame"
          />
        </div>
      </div>

      <div class="loadgame-messages" aria-live="assertive">
        <div v-if="message" :class="['msg', 'msg--' + messageType]">
          {{ message }}
        </div>
      </div>

      <div class="buttons">
        <a class="gbtn btn btn-warning" href="/main-menu" @click="goBack">Back</a>
        <button 
          class="gbtn btn load-game-btn" 
          :class="{ disabled: !canLoad }"
          :disabled="!canLoad"
          @click="loadGame"
        >
          {{ isLoading ? 'Loading...' : 'Load' }}
        </button>
      </div>

      <GameAlert
        v-if="showAlert"
        :message="alertMessage"
        @close="closeAlert"
      />
    </div>
  `
};
