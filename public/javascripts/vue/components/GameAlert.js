export default {
  name: 'GameAlert',
  props: {
    message: {
      type: String,
      required: true
    }
  },
  emits: ['close'],
  setup(props, { emit }) {
    const handleClose = () => {
      emit('close');
    };

    return {
      handleClose
    };
  },
  template: `
    <div class="game-alert-overlay" @click="handleClose">
      <div class="game-alert" @click.stop>
        <p>{{ message }}</p>
        <button class="game-alert__close" @click="handleClose">OK</button>
      </div>
    </div>
  `
};
