declare const require: any;

const cardsContext = require.context(
  '@/assets/images/cards',
  false,
  /\.png$/
);

const CARD_URLS = new Map<string, string>();

cardsContext.keys().forEach((key: string) => {
  const fileName = key.replace('./', '');
  const url = cardsContext(key) as string;
  CARD_URLS.set(fileName, url);
});
export interface CardImageRegistryOptions {
  cardsPath?: string;
}

export interface CardImageRegistry {
  preloadAll(): Promise<void>;
  getImageUrl(fileName: string | null | undefined): string;
  getImageForCard(cardFileName: string | null | undefined): string;
  getDefeatedImage(): string;
  clear(): void;
  getAllUrls(): string[]
}

export function createCardImageRegistry(
  options: CardImageRegistryOptions = {},
): CardImageRegistry {
  const cardsPath = options.cardsPath;

  const images = new Map<string, HTMLImageElement>();

  function resolveUrl(fileName: string): string {
    const withExt = fileName.endsWith('.png') ? fileName : `${fileName}.png`;

    const byManifest = CARD_URLS.get(withExt);
    if (byManifest) return byManifest;

    if (cardsPath) {
      return `${cardsPath}${withExt}`;
    }

    return withExt;
  }

  let fallback = resolveUrl('flippedCard.png');
  let defeated = resolveUrl('defeated.png');

  function preloadOne(fileName: string): Promise<HTMLImageElement> {
    const u = resolveUrl(fileName);
    return new Promise((resolve, reject) => {
      const withExt = fileName.endsWith('.png') ? fileName : `${fileName}.png`;

      if (images.has(withExt)) {
        resolve(images.get(withExt)!);
        return;
      }

      const img = new Image();
      img.onload = () => {
        images.set(withExt, img);
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
      img.src = resolveUrl('flippedCard.png');
      images.set('flippedCard.png', img);
    }

    if (!images.has('defeated.png')) {
      const img = new Image();
      img.src = resolveUrl('defeated.png');
      images.set('defeated.png', img);
    }

    fallback = images.get('flippedCard.png')!.src;
    defeated = images.get('defeated.png')!.src;
  }

  function getImageUrl(fileName: string | null | undefined): string {
    if (!fileName) return fallback;

    const withExt = fileName.endsWith('.png') ? fileName : `${fileName}.png`;
    const img = images.get(withExt);
    if (img) return img.src;

    return resolveUrl(withExt);
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

  function getAllUrls(): string[] {
    const urls: string[] = [];

    const suits = ['hearts', 'diamonds', 'clubs', 'spades'] as const;
    const values = ['2','3','4','5','6','7','8','9','10','jack','queen','king','ace'] as const;

    values.forEach((v) => suits.forEach((s) => urls.push(resolveUrl(`${v}_of_${s}.png`))));
    urls.push(resolveUrl('flippedCard.png'), resolveUrl('defeated.png'));

    return urls;
  }


  return {
    preloadAll,
    getImageUrl,
    getImageForCard,
    getDefeatedImage,
    clear,
    getAllUrls,
  };
}
