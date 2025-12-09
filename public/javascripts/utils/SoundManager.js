
export function createSoundManager({ basePath = '/assets/sounds/' } = {}) {
  const sounds = new Map();
  let unlocked = false;


  function preload(name, fileName) {
    const fullPath = `${basePath}${fileName}`;
    const audio = new Audio(fullPath);
    audio.preload = 'auto';
    audio.volume = 0.5;

    audio.addEventListener('canplaythrough', () => {
    });

    audio.addEventListener('error', (e) => {
    });

    sounds.set(name, audio);
    return audio;
  }

  /**
   because browsers blocks audio autoplay
   */
  function unlock() {
    if (unlocked) return;
    const a = new Audio();
    a.volume = 0;
    const playPromise = a.play();

    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          unlocked = true;
        })
        .catch(() => {
        });
    }
  }

  window.addEventListener(
    'pointerdown',
    () => {
      unlock();
    },
    { once: true }
  );
  window.addEventListener(
    'keydown',
    () => {
      unlock();
    },
    { once: true }
  );

  function play(name, { volume = 1.0, loop = false } = {}) {
    const audio = sounds.get(name);
    if (!audio) {
      return null;
    }

    try {
      const clone = audio.cloneNode();
      clone.volume = Math.max(0, Math.min(1, volume));
      clone.loop = loop;

      if (!loop) {
        clone.addEventListener('ended', () => clone.remove());
      }

      const playPromise = clone.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
          })
          .catch((err) => {
            console.warn(`[SoundManager] Failed to play "${name}":`, err.message);
            if (err.name === 'NotAllowedError') {
              console.warn('[SoundManager] Autoplay blocked. Will unlock on user interaction.');
            }
          });
      }

      return clone;
    } catch (err) {
      console.warn(`[SoundManager] Error playing "${name}":`, err);
      return null;
    }
  }

  function stop(audioInstance) {
    if (audioInstance) {
      audioInstance.pause();
      audioInstance.currentTime = 0;
    }
  }
  function setVolume(name, volume) {
    const audio = sounds.get(name);
    if (audio) {
      audio.volume = Math.max(0, Math.min(1, volume));
    }
  }

  function debug() {
    sounds.forEach((audio, name) => {
      console.log(`  - ${name}: ready=${audio.readyState >= 2}, src=${audio.src}`);
    });
  }

  return {
    preload,
    play,
    stop,
    setVolume,
    debug,
    unlock
  };
}