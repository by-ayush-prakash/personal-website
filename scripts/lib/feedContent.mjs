// Shared between scripts/fetch-feeds.mjs (new items, from the live feed) and
// scripts/migrate-podcast-cleanup.mjs (existing files, one-off). Keeping this
// in one place means both paths apply byte-for-byte the same rule.

export const DESCRIPTION_MAX_LEN = 300;

export function stripHtmlBlock(html) {
  return String(html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function toDescription(html, maxLen = DESCRIPTION_MAX_LEN) {
  const text = stripHtmlBlock(html);
  return text.length > maxLen ? `${text.slice(0, maxLen - 3).trimEnd()}...` : text;
}

// Paragraph-level triggers marking "the promo outro starts here." Substring
// checks, not full-line equality, so "Connect with Dr. Anbar:" (genuine guest
// attribution) never matches "Connect:" (Ayush's own generic outro heading) —
// there is no literal "connect:" substring in "connect with x:". A lone "-"
// divider is also treated as a trigger: on already-partially-cleaned files
// (labels stripped by an earlier pass, leaving a bare "-" then "Info:" with
// nothing after it) this is what's left marking the same boundary.
function isBoilerplateMarker(text) {
  if (!text) return false;
  if (/podcast info:/i.test(text)) return true;
  if (/connect:/i.test(text)) return true;
  if (/^info:/i.test(text)) return true;
  if (text === '-') return true;
  return false;
}

function isBlankOrDivider(text) {
  return text === '' || text === '-';
}

// Bare (unlabeled) subscribe URLs to Ayush's own channels. Only matches a
// paragraph whose ENTIRE text is just the URL — a labeled line ("LinkedIn:
// https://linkedin.com/in/some-guest") is left alone on purpose, since a
// guest's own attribution is genuine content, not promo boilerplate.
const BARE_SUBSCRIBE_URL = /^https?:\/\/\S*(open\.spotify\.com|podcasts\.apple\.com|apple\.co|instagram\.com|linkedin\.com)\S*$/i;

/**
 * Cuts everything from the first boilerplate-marker paragraph onward, trims
 * any blank/divider paragraphs left dangling right before that cut, and
 * drops any remaining bare subscribe-URL paragraph. Works whether `html` is
 * pristine (fresh from the feed, full "Podcast Info:"/"Connect:" labels) or
 * already partially stripped (bare fragments left behind by an earlier pass)
 * — same predicate catches both shapes.
 */
export function stripPromoBoilerplate(html) {
  const original = String(html || '');
  const blocks = original.match(/<p[^>]*>[\s\S]*?<\/p>/gi);

  if (!blocks || blocks.length === 0) {
    return { cleaned: original.trim(), changed: false };
  }

  let cutIndex = -1;
  for (let i = 0; i < blocks.length; i++) {
    if (isBoilerplateMarker(stripHtmlBlock(blocks[i]))) {
      cutIndex = i;
      break;
    }
  }

  let kept = cutIndex === -1 ? blocks.slice() : blocks.slice(0, cutIndex);
  while (kept.length > 0 && isBlankOrDivider(stripHtmlBlock(kept[kept.length - 1]))) {
    kept.pop();
  }
  kept = kept.filter((block) => !BARE_SUBSCRIBE_URL.test(stripHtmlBlock(block)));

  const cleaned = kept.join('').trim();
  return { cleaned, changed: cleaned !== original.trim() };
}
