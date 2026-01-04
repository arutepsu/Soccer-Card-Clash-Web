export interface PlayOptions {
  volume?: number;
  loop?: boolean;
}

export interface SoundManager {
  preload(name: string, fileName: string): HTMLAudioElement;
  play(name: string, options?: PlayOptions): HTMLAudioElement | null;
  stop(audioInstance: HTMLAudioElement | null | undefined): void;
  setVolume(name: string, volume: number): void;
  debug(): void;
  unlock(): void;
}

interface CreateSoundManagerOptions {
  basePath?: string;
}

export function createSoundManager(
  { basePath = '/assets/sounds/' }: CreateSoundManagerOptions = {},
): SoundManager {
  const sounds = new Map<string, HTMLAudioElement>();
  let unlocked = false;

  function preload(name: string, fileNameOrUrl: string): HTMLAudioElement {
    const isAbsolute =
      fileNameOrUrl.startsWith('http://') ||
      fileNameOrUrl.startsWith('https://') ||
      fileNameOrUrl.startsWith('/');

    const fullPath = isAbsolute ? fileNameOrUrl : `${basePath}${fileNameOrUrl}`;

    const audio = new Audio(fullPath);
    audio.preload = 'auto';
    audio.volume = 0.5;

    audio.addEventListener('error', (e) => {
    });

    sounds.set(name, audio);
    return audio;
  }


  function unlock(): void {
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
    { once: true },
  );
  window.addEventListener(
    'keydown',
    () => {
      unlock();
    },
    { once: true },
  );

  function play(name: string, { volume = 1.0, loop = false }: PlayOptions = {}): HTMLAudioElement | null {
    const audio = sounds.get(name);
    if (!audio) {
      return null;
    }

    try {
      const clone = audio.cloneNode() as HTMLAudioElement;
      clone.volume = Math.max(0, Math.min(1, volume));
      clone.loop = loop;

      if (!loop) {
        clone.addEventListener('ended', () => clone.remove());
      }

      const playPromise = clone.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // ok
          })
          .catch((err) => {
            if (err.name === 'NotAllowedError') {
            }
          });
      }

      return clone;
    } catch (err) {
      return null;
    }
  }

  function stop(audioInstance: HTMLAudioElement | null | undefined): void {
    if (audioInstance) {
      audioInstance.pause();
      audioInstance.currentTime = 0;
    }
  }

  function setVolume(name: string, volume: number): void {
    const audio = sounds.get(name);
    if (audio) {
      audio.volume = Math.max(0, Math.min(1, volume));
    }
  }

  function debug(): void {
    sounds.forEach((audio, name) => {
    });
  }

  return {
    preload,
    play,
    stop,
    setVolume,
    debug,
    unlock,
  };
}
