export interface CardImageRegistryOptions {
  cardsPath?: string;
}

export interface CardImageRegistry {
  preloadAll(): Promise<void>;
  getImageUrl(fileName: string | null | undefined): string;
  getImageForCard(cardFileName: string | null | undefined): string;
  getDefeatedImage(): string;
  clear(): void;
}

export function createCardImageRegistry(
  options: CardImageRegistryOptions = {},
): CardImageRegistry {
  const cardsPath = options.cardsPath ?? '/assets/images/cards/';
  const images = new Map<string, HTMLImageElement>();

  let fallback = cardsPath + 'flippedCard.png';
  let defeated = cardsPath + 'defeated.png';

  function url(fileName: string): string {
    return `${cardsPath}${fileName}`;
  }

  function preloadOne(fileName: string): Promise<HTMLImageElement> {
    const u = url(fileName);
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
      img.onerror = () => reject(new Error(`Image not found: ${u}`));
      img.src = u;
    });
  }

  async function preloadAll(): Promise<void> {
    const suits = ['hearts', 'diamonds', 'clubs', 'spades'] as const;
    const values = [
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '10',
      'jack',
      'queen',
      'king',
      'ace',
    ] as const;

    const all: string[] = [];
    values.forEach((v) =>
      suits.forEach((s) => all.push(`${v}_of_${s}.png`)),
    );
    all.push('flippedCard.png', 'defeated.png');

    await Promise.allSettled(all.map(preloadOne));

    if (!images.has('flippedCard.png')) {
      const img = new Image();
      img.src = fallback;
      images.set('flippedCard.png', img);
    }

    if (!images.has('defeated.png')) {
      const img = new Image();
      img.src = defeated;
      images.set('defeated.png', img);
    }

    fallback = images.get('flippedCard.png')!.src;
    defeated = images.get('defeated.png')!.src;
  }

  function getImageUrl(fileName: string | null | undefined): string {
    if (!fileName) return fallback;
    const withExt = fileName.endsWith('.png') ? fileName : `${fileName}.png`;
    const img = images.get(withExt);
    return img?.src ?? url(withExt);
  }

  function getImageForCard(cardFileName: string | null | undefined): string {
    return getImageUrl(cardFileName);
  }

  function getDefeatedImage(): string {
    return defeated;
  }

  function clear(): void {
    images.clear();
  }

  return {
    preloadAll,
    getImageUrl,
    getImageForCard,
    getDefeatedImage,
    clear,
  };
}
