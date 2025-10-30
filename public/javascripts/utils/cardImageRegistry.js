export function createCardImageRegistry(options = {}) {
  const cardsPath = options.cardsPath ?? "/assets/images/cards/";
  const images = new Map();
  let fallback = cardsPath + "flippedCard.png";
  let defeated = cardsPath + "defeated.png";

  function url(fileName) { return `${cardsPath}${fileName}`; }

  function _preloadOne(fileName) {
    const u = url(fileName);
    return new Promise((resolve, reject) => {
      if (images.has(fileName)) return resolve(images.get(fileName));
      const img = new Image();
      img.onload = () => { images.set(fileName, img); resolve(img); };
      img.onerror = () => reject(new Error(`Image not found: ${u}`));
      img.src = u;
    });
  }

  async function preloadAll() {
    const suits = ["hearts","diamonds","clubs","spades"];
    const values = ["2","3","4","5","6","7","8","9","10","jack","queen","king","ace"];
    const all = [];
    values.forEach(v => suits.forEach(s => all.push(`${v}_of_${s}.png`)));
    all.push("flippedCard.png", "defeated.png");

    await Promise.allSettled(all.map(_preloadOne));

    if (!images.has("flippedCard.png")) images.set("flippedCard.png", Object.assign(new Image(), { src: fallback }));
    if (!images.has("defeated.png")) images.set("defeated.png", Object.assign(new Image(), { src: defeated }));
    fallback = images.get("flippedCard.png").src;
    defeated = images.get("defeated.png").src;
  }

    function getImageUrl(fileName) {
    if (!fileName) return fallback;
    const withExt = fileName.endsWith('.png') ? fileName : `${fileName}.png`;
    return images.get(withExt)?.src ?? url(withExt);
    }

    function getImageForCard(cardFileName) {
    return getImageUrl(cardFileName);
    }


  function getImageForCard(cardFileName) {
    return getImageUrl(cardFileName);
  }

  function getDefeatedImage() {
    return defeated;
  }

  function clear() { images.clear(); }

  return {
    preloadAll,
    getImageUrl,
    getImageForCard,
    getDefeatedImage,
    clear,
  };
}
