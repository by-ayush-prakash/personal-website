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

const ALT: Record<string, string> = {
  'Cognition & Development': 'A brain rendered in light at a gallery exhibition',
  'Minds & Consciousness': 'A figure standing before a projected galaxy',
  'Human–AI Relationships': 'An illustration of a head opened like a doorway, a small figure climbing in',
  'Governance & Society': 'The Canadian flag flying before the Peace Tower in Ottawa',
  'Youth & Education': 'Students at desks facing a teacher in a classroom',
};

export function themeAlt(theme: string | undefined): string {
  return (theme && ALT[theme]) || '';
}
