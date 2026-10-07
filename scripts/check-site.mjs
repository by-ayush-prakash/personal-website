import { readFile, readdir, access } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
async function files(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return (await Promise.all(entries.map(e => e.isDirectory() ? files(path.join(dir, e.name)) : path.join(dir, e.name)))).flat();
}
const all = await files('dist');
const pages = all.filter(f => f.endsWith('/index.html'));
const exists = async (p) => { try { await access(p); return true; } catch { return false; } };
const errors = [];
for (const page of pages) {
  const html = await readFile(page, 'utf8');
  for (const match of html.matchAll(/(?:href|src)="(\/[^"#?]*)(?:[?#][^"]*)?"/g)) {
    const target = path.join('dist', decodeURIComponent(match[1]));
    if (!await exists(target) && !await exists(path.join(target, 'index.html'))) errors.push(`${page}: missing ${match[1]}`);
  }
  const image = html.match(/property="og:image" content="https:\/\/ayushprakash.com(\/share\/[^" ]+)"/);
  if (!image || !await exists(path.join('dist', image[1]))) errors.push(`${page}: missing sharing image`);
  if (image) {
    const png = await readFile(path.join('dist', image[1]));
    if (png.readUInt32BE(16) !== 1200 || png.readUInt32BE(20) !== 630) errors.push(`${page}: incorrect sharing dimensions`);
  }
  const canonical = html.match(/rel="canonical" href="([^"]+)"/);
  const ogURL = html.match(/property="og:url" content="([^"]+)"/);
  if (!canonical || !ogURL || canonical[1] !== ogURL[1]) errors.push(`${page}: inconsistent canonical URL`);
  if (!html.includes('<main id="main-content">')) errors.push(`${page}: missing main landmark`);
}
assert.equal(errors.length, 0, errors.join('\n'));
assert(!await exists('dist/research/index.html'), 'Retired research route must remain absent and return 404');
const sitemapFiles = all.filter(f => /sitemap-\d+\.xml$/.test(f));
const sitemap = (await Promise.all(sitemapFiles.map(f => readFile(f, 'utf8')))).join('');
assert(!sitemap.includes('/share/'), 'Sharing images must not appear as pages in the sitemap');
console.log(`Verified ${pages.length} pages, internal links/assets, canonical URLs, sharing PNGs, landmarks and sitemap.`);
