export default {
  name: 'Overlay',
  props: {
    title: String,
    messageHtml: String,
    bgImagePath: String,
    safeTop: String,
    safeRight: String,
    safeBottom: String,
    safeLeft: String
  },
  emits: ['close'],
  setup(props, { emit }) {
    const handleClose = () => {
      emit('close');
    };
    return { handleClose };
  },
  template: `
    <teleport to="body">
      <div class="overlay-frame" :style="{ backgroundImage: 'url(' + bgImagePath + ')', paddingTop: safeTop, paddingRight: safeRight, paddingBottom: safeBottom, paddingLeft: safeLeft, position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9999 }">
        <div class="overlay-scroll">
          <div class="overlay-content">
            <h2>{{ title }}</h2>
            <div v-html="messageHtml"></div>
            <button class="gbtn" @click="handleClose">Close</button>
          </div>
        </div>
      </div>
    </teleport>
  `
};
