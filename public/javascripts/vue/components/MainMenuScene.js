import { ref, onMounted } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js';
import Overlay from './Overlay.js';
import { createSoundManager } from '../../utils/soundManager.js';

export default {
  name: 'MainMenuScene',
  components: { Overlay },
  setup() {
    const showOverlay = ref(false);
    const soundManager = createSoundManager({ basePath: '/assets/sounds/' });
    const menuItems = [
      { label: 'Singleplayer', href: '/singleplayer', type: 'link' },
      { label: 'Multiplayer', href: '/multiplayer', type: 'link' },
      { label: 'Load Game', href: '/load-game', type: 'link' },
      { label: 'About', type: 'button', action: () => showOverlay.value = true },
      { label: 'Game Information', href: '/rules', type: 'link' },
      { label: 'Logout', href: '/login', type: 'link' }
    ];
    const aboutContent = `<p><strong>Soccer Card Clash</strong> is a fast-paced, strategic 2-player card game where soccer meets tactical mind games!</p>
      <p>Each player takes turns attacking and defending using a hand of soccer-themed cards. Every card represents a player with unique strengths. You must outmaneuver your opponent by choosing the right card at the right moment!</p>
      <p>Roles switch after each round: today's attacker becomes tomorrow's defender. Strategic use of boosts and goalkeeper plays can shift the tide in your favor.</p>
      <p>Victory goes to the player who scores the most successful attacks by the end of the match. Are you ready to kick off and clash?</p>`;
    const aboutTitle = 'About the Game';
    const aboutBgImage = '/assets/images/frames/overlay.png';

    onMounted(() => {
      soundManager.preload('hover', 'hover.wav');
      soundManager.preload('click', 'attack.wav');
    });

    const handleMouseEnter = () => {
      soundManager.play('hover', { volume: 0.8 });
    };
    const handleClick = (item) => {
      if (item.type === 'button' && item.action) {
        item.action();
      }
      soundManager.play('click', { volume: 0.6 });
    };
    const closeOverlay = () => {
      showOverlay.value = false;
    };

    return {
      menuItems,
      showOverlay,
      aboutContent,
      aboutTitle,
      aboutBgImage,
      handleMouseEnter,
      handleClick,
      closeOverlay
    };
  },
  template: `
    <div class="scene scene--mainmenu is-active" aria-hidden="false">
      <div class="container-fluid h-100">
        <div class="row h-100 align-items-center justify-content-center">
          <div class="col-12 col-sm-10 col-md-8 col-lg-6 col-xl-5">
            <div class="menu-stack">
              <div class="text-center mb-3">
                <img class="logo-image img-fluid"
                     src="/assets/images/logo/logo0.5k.png"
                     alt="Soccer Card Clash Logo" />
              </div>
              <nav class="buttons" aria-label="Main menu">
                <div class="d-grid gap-2">
                  <template v-for="item in menuItems">
                    <a v-if="item.type === 'link'"
                       class="gbtn"
                       :href="item.href"
                       @mouseenter="handleMouseEnter"
                       @click="handleClick(item)">
                      {{ item.label }}
                    </a>
                    <button v-else
                            class="gbtn"
                            type="button"
                            @mouseenter="handleMouseEnter"
                            @click="handleClick(item)">
                      {{ item.label }}
                    </button>
                  </template>
                </div>
              </nav>
            </div>
          </div>
        </div>
      </div>
      <div class="info-label">Developed by Arutepsu</div>
      <Overlay
        v-if="showOverlay"
        :title="aboutTitle"
        :message-html="aboutContent"
        :bg-image-path="aboutBgImage"
        :safe-top="'8%'"
        :safe-right="'6%'"
        :safe-bottom="'12%'"
        :safe-left="'6%'"
        @close="closeOverlay"
      />
    </div>
  `
};
