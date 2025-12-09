import type {
  PlayerLike,
  AiPlayerTypeShape,
} from '../types/WebGameState';
import player1Jpg from '@/assets/images/players/player1.jpg';
import player2Jpg from '@/assets/images/players/player2.jpg';
import aiJpg       from '@/assets/images/players/ai.jpg';
import takaJpg     from '@/assets/images/players/taka.jpg';
import defendraJpg from '@/assets/images/players/defendra.jpg';
import bitstromJpg from '@/assets/images/players/bitstrom.jpg';
import metaJpg     from '@/assets/images/players/meta.jpg';
export interface PlayerAvatarRegistryOptions {
  avatarsPath?: string;
  fileNames?: string[];
}

export interface PlayerAvatarRegistry {
  avatarsPath: string;
  preloadAvatars(): Promise<void>;
  assignAvatar(player: PlayerLike, fileName: string): void;
  assignAvatarsInOrder(players: PlayerLike[]): void;
  getAvatarFileName(player: PlayerLike): string;
  getAvatarUrl(player: PlayerLike): string;
  getAvatarImg(
    player: PlayerLike,
    opts?: { scale?: number; baseWidth?: number },
  ): HTMLImageElement;
  getImages(): Record<string, string>;
}

export function createPlayerAvatarRegistry(
  options: PlayerAvatarRegistryOptions = {},
): PlayerAvatarRegistry {
  const avatarsPath = options.avatarsPath ?? '/assets/images/players/';
  const knownFiles = options.fileNames ?? [
    'player1.jpg',
    'player2.jpg',
    'ai.jpg',
    'taka.jpg',
    'defendra.jpg',
    'bitstrom.jpg',
    'meta.jpg',
  ];

  const aiStrategyMap: Record<string, string> = {
    TakaStrategy: 'taka.jpg',
    BitstormStrategy: 'bitstrom.jpg',
    DefendraStrategy: 'defendra.jpg',
    MetaAIStrategy: 'meta.jpg',
  };

  const avatarUrlMap: Record<string, string> = {
    'player1.jpg': player1Jpg,
    'player2.jpg': player2Jpg,
    'ai.jpg': aiJpg,
    'taka.jpg': takaJpg,
    'defendra.jpg': defendraJpg,
    'bitstrom.jpg': bitstromJpg,
    'meta.jpg': metaJpg,
  };

  const images = new Map<string, HTMLImageElement>();
  const playerImageMap = new Map<string, string>();

  function fileUrl(fileName: string): string {
    return avatarUrlMap[fileName] ?? `${avatarsPath}${fileName}`;
  }

  function preload(fileName: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      if (images.has(fileName)) {
        resolve(images.get(fileName)!);
        return;
      }

      const img = new Image();
      img.onload = () => {
        images.set(fileName, img);
        resolve(img);
      };
      img.onerror = () =>
        reject(new Error(`Avatar image not found: ${fileName}`));
      img.src = fileUrl(fileName);
    });
  }

  async function preloadAvatars(): Promise<void> {
    await Promise.all(knownFiles.map(preload));
  }

  function assignAvatar(player: PlayerLike, fileName: string): void {
    playerImageMap.set(player.id, fileName);
  }

  function isAI(playerType: PlayerLike['playerType']): playerType is AiPlayerTypeShape {
    if (playerType === 'Human') return false;
    if (typeof playerType === 'object' && playerType) {
      const k = (playerType as AiPlayerTypeShape).kind ??
                (playerType as AiPlayerTypeShape).type;
      return String(k).toUpperCase() === 'AI';
    }
    return false;
  }

  function normalizeStrategyName(name: string | undefined | null): string {
    if (!name) return '';
    const parts = String(name).split(/[.$]/);
    return parts[parts.length - 1];
  }

  function assignAvatarsInOrder(players: PlayerLike[]): void {
    let humanCounter = 1;

    for (const fileName of playerImageMap.values()) {
      const m = /^player(\d+)\.jpg$/i.exec(fileName);
      if (m) {
        const n = Number(m[1]);
        if (Number.isFinite(n) && n >= humanCounter) {
          humanCounter = n + 1;
        }
      }
    }

    players.forEach((player) => {
      if (playerImageMap.has(player.id)) {
        return;
      }

      const pt = player.playerType;
      if (isAI(pt)) {
        const strategyName =
          typeof pt === 'object' && pt
            ? normalizeStrategyName((pt as AiPlayerTypeShape).strategy)
            : '';
        const fileName = aiStrategyMap[strategyName] ?? 'ai.jpg';
        assignAvatar(player, fileName);
      } else {
        const fileName = `player${humanCounter}.jpg`;
        assignAvatar(player, fileName);
        humanCounter += 1;
      }
    });
  }


  function getAvatarFileName(player: PlayerLike): string {
    const fileName = playerImageMap.get(player.id);
    if (!fileName) {
      throw new Error(
        `No avatar assigned for player: ${player.name ?? player.id}`,
      );
    }
    return fileName;
  }

  function getAvatarUrl(player: PlayerLike): string {
    return fileUrl(getAvatarFileName(player));
  }

  function getAvatarImg(
    player: PlayerLike,
    _opts: { scale?: number; baseWidth?: number } = {},
  ): HTMLImageElement {
    const img = new Image();
    img.src = getAvatarUrl(player);
    img.className = 'player__avatar';
    img.style.width = '';
    img.style.height = '';
    img.loading = 'eager';
    return img;
  }

  function getImages(): Record<string, string> {
    const entries: [string, string][] = [];
    for (const key of images.keys()) {
      entries.push([key, fileUrl(key)]);
    }
    return Object.fromEntries(entries);
  }

  return {
    avatarsPath,
    preloadAvatars,
    assignAvatar,
    assignAvatarsInOrder,
    getAvatarFileName,
    getAvatarUrl,
    getAvatarImg,
    getImages,
  };
}
