// One image per research theme. Untagged items fall back to "general".
const SLUGS: Record<string, string> = {
  'Cognition & Development': 'cognition',
  'Minds & Consciousness': 'minds',
  'Human–AI Relationships': 'relationships',
  'Governance & Society': 'governance',
  'Youth & Education': 'youth',
};

export type ImgShape = 'card' | 'sq' | 'wide';

export function themeImage(theme: string | undefined, shape: ImgShape = 'card'): string {
  const slug = (theme && SLUGS[theme]) || 'general';
  return `/img/theme-${slug}-${shape}.jpg`;
}

export function themeAlt(theme: string | undefined): string {
  return theme ? `${theme}` : '';
}
