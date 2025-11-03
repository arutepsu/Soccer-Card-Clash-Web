// playersAvatarRegistryWeb.js

export function createPlayerAvatarRegistry(options = {}) {
  const avatarsPath = options.avatarsPath ?? "/assets/images/players/";
  const knownFiles = options.fileNames ?? [
    "player1.jpg",
    "player2.jpg",
    "ai.jpg",
    "taka.jpg",
    "defendra.jpg",
    "bitstrom.jpg",
    "meta.jpg",
  ];

  const aiStrategyMap = {
    TakaStrategy: "taka.jpg",
    BitstormStrategy: "bitstrom.jpg",
    DefendraStrategy: "defendra.jpg",
    MetaAIStrategy: "meta.jpg",
  };

  const images = new Map();
  const playerImageMap = new Map();


  function fileUrl(fileName) {
    return `${avatarsPath}${fileName}`;
  }

  function preload(fileName) {
    return new Promise((resolve, reject) => {
      if (images.has(fileName)) return resolve(images.get(fileName));
      const img = new Image();
      img.onload = () => { images.set(fileName, img); resolve(img); };
      img.onerror = () => reject(new Error(`Avatar image not found: ${fileName}`));
      img.src = fileUrl(fileName);
    });
  }

  async function preloadAvatars() {
    await Promise.all(knownFiles.map(preload));
  }

  function assignAvatar(player, fileName) {
    playerImageMap.set(player.id, fileName);
  }

  function assignAvatarsInOrder(players) {
    let humanCounter = 1;

    players.forEach((player) => {
      const pt = player.playerType;
      if (isAI(pt)) {
        const simple = normalizeStrategyName(pt.strategy);
        const fileName = aiStrategyMap[simple] ?? "ai.jpg";
        assignAvatar(player, fileName);
      } else {
        const fileName = `player${humanCounter}.jpg`;
        assignAvatar(player, fileName);
        humanCounter += 1;
      }
    });
  }

  function getAvatarFileName(player) {
    const fileName = playerImageMap.get(player.id);
    if (!fileName) throw new Error(`No avatar assigned for player: ${player.name}`);
    return fileName;
  }

  function getAvatarUrl(player) {
    return fileUrl(getAvatarFileName(player));
  }

  function getAvatarImg(player, { scale = 0.07, baseWidth = 1500 } = {}) {
    const img = new Image();
    img.src = getAvatarUrl(player);
    img.className = "player__avatar";
    img.style.width = "";
    img.style.height = "";
    img.loading = "eager";
    return img;
  }

  function isAI(playerType) {
    if (playerType === "Human") return false;
    if (typeof playerType === "object" && playerType) {
      const k = playerType.kind ?? playerType.type;
      return String(k).toUpperCase() === "AI";
    }
    return false;
  }

  function normalizeStrategyName(name) {
    if (!name) return "";
    const parts = String(name).split(/[.$]/);
    return parts[parts.length - 1];
  }

  return {
    avatarsPath,
    preloadAvatars,
    assignAvatar,
    assignAvatarsInOrder,
    getAvatarFileName,
    getAvatarUrl,
    getAvatarImg,
    getImages: () => Object.fromEntries([...images.keys()].map(k => [k, fileUrl(k)])),
  };
}
