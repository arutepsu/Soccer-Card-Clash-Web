import { ref } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js';
import { createSoundManager } from '../../utils/soundManager.js';

export default {
  name: 'SaveGameCard',
  props: {
    gameId: {
      type: String,
      required: true
    },
    fileName: {
      type: String,
      required: true
    },
    updatedAt: {
      type: String,
      default: null
    },
    isSelected: {
      type: Boolean,
      default: false
    }
  },
  emits: ['select'],
  setup(props, { emit }) {
    const soundManager = createSoundManager({ basePath: '/assets/sounds/' });

    const handleMouseEnter = () => {
      soundManager.play('hover', { volume: 0.3 });
    };

    const handleClick = () => {
      emit('select', props.gameId);
    };

    const formatDate = (iso) => {
      if (!iso) return '';
      try {
        return new Date(iso).toLocaleString();
      } catch {
        return iso;
      }
    };

    return {
      handleMouseEnter,
      handleClick,
      formatDate
    };
  },
  template: `
    <div 
      class="save-card" 
      :class="{ selected: isSelected }"
      @mouseenter="handleMouseEnter"
      @click="handleClick"
    >
      <div class="save-card__header">
        <strong class="save-title">{{ fileName }}</strong>
      </div>
      <div v-if="updatedAt" class="save-card__meta">
        Updated: {{ formatDate(updatedAt) }}
      </div>
    </div>
  `
};
