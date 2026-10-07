import { createHash } from 'node:crypto';

export function sourceKey(value) {
  try {
    const url = new URL(value);
    const episode = url.pathname.match(/-([a-z]\d[a-z0-9]+)$/i);
    if (/^(podcasters\.spotify\.com|anchor\.fm)$/.test(url.hostname) && episode) return `spotify:${episode[1]}`;
    return `${url.hostname}${url.pathname.replace(/\/+$/, '')}`;
  } catch { return value; }
}

export function audioKey(value) {
  const match = String(value).match(/\/podcast\/play\/(\d+)\//);
  return match ? `anchor:${match[1]}` : value;
}

export function collisionSlug(slug, identity) {
  return `${slug}-${createHash('sha256').update(identity).digest('hex').slice(0, 10)}`;
}
