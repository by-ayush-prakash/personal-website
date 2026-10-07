#!/usr/bin/env node
// Build-time content fetch. Run manually (`npm run content:fetch`), never from
// `astro build` itself — the generated .md files are committed so the site
// still builds when a feed is unreachable (CLAUDE.md's architecture rule).
//
// New items are added without overwriting existing content. Podcast titles are
// refreshed from the feed by stable source/audio identity; other hand-edited
// frontmatter and episode URLs are preserved.

import { writeFile, mkdir, access, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { XMLParser } from 'fast-xml-parser';
import { sourceKey, audioKey, collisionSlug } from './lib/feedIdentity.mjs';
import { stripHtmlBlock as stripHtml, toDescription, stripPromoBoilerplate } from './lib/feedContent.mjs';

const FEEDS = [
  { url: 'https://ayushprakash.substack.com/feed', source: 'substack' },
  { url: 'https://anchor.fm/s/4f9f9cb0/podcast/rss', source: 'anchor' },
];

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const CONTENT_DIR = path.join(ROOT, 'src', 'content');

// "Materially shorter" for the truncation check: content:encoded is less
// than 90% of the plain-text length of the RSS description. A few percent
// of drift from HTML-stripping differences shouldn't false-positive.
const TRUNCATION_RATIO = 0.9;

function slugify(input) {
  const base = String(input)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return base || 'untitled';
}

function normalizeDuration(raw) {
  if (raw == null) return undefined;
  const str = String(raw).trim();
  if (!str) return undefined;
  if (/^\d+$/.test(str)) {
    const total = parseInt(str, 10);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const parts = h > 0 ? [h, m, s] : [m, s];
    return parts.map((n, i) => (i === 0 ? String(n) : String(n).padStart(2, '0'))).join(':');
  }
  return str;
}

function textOf(node) {
  if (node == null) return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (typeof node === 'object' && '#text' in node) return String(node['#text']);
  return '';
}

function getEnclosure(item) {
  const enc = item.enclosure;
  if (!enc) return null;
  const list = Array.isArray(enc) ? enc : [enc];
  return list.find((e) => String(e?.['@_type'] || '').toLowerCase().startsWith('audio/')) || null;
}

export async function fetchFeed(url, fetchImpl = fetch) {
  const res = await fetchImpl(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      Accept: 'application/rss+xml, application/xml, text/xml',
    },
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const xml = await res.text();
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
  const data = parser.parse(xml);
  const items = data?.rss?.channel?.item;
  if (!items) throw new Error('Feed returned no RSS items');
  return Array.isArray(items) ? items : [items];
}

export async function fetchSubstackAPI(fetchImpl = fetch) {
  const url = 'https://ayushprakash.substack.com/api/v1/posts?limit=20&offset=0';
  const res = await fetchImpl(url, {
    headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const posts = await res.json();
  if (!Array.isArray(posts)) throw new Error('Substack API returned no post list');
  return posts
    .filter((post) => post.is_published && post.audience === 'everyone')
    .map((post) => ({
      title: post.title,
      link: post.canonical_url,
      guid: post.id,
      pubDate: post.post_date,
      description: post.description || post.subtitle || '',
      'content:encoded': post.body_html || '',
    }));
}

export async function fetchSubstackReader(fetchImpl = fetch) {
  // GitHub-hosted runners can be blocked by Substack even for public feeds.
  // Jina Reader fetches the public Substack API and returns its JSON payload.
  const res = await fetchImpl('https://r.jina.ai/http://ayushprakash.substack.com/api/v1/posts?limit=20%26offset=0', {
    headers: { Accept: 'text/plain' },
    signal: AbortSignal.timeout(45_000),
  });
  if (!res.ok) throw new Error(`Reader HTTP ${res.status}`);
  const text = await res.text();
  const marker = 'Markdown Content:\n';
  const payload = text.slice(text.indexOf(marker) + marker.length).trim();
  if (!text.includes(marker)) throw new Error('Reader returned no post data');
  const posts = JSON.parse(payload);
  if (!Array.isArray(posts)) throw new Error('Reader returned no post list');
  return posts
    .filter((post) => post.is_published && post.audience === 'everyone')
    .map((post) => ({
      title: post.title,
      link: post.canonical_url,
      guid: post.id,
      pubDate: post.post_date,
      description: post.description || post.subtitle || '',
      'content:encoded': post.body_html || '',
    }));
}

async function fileExists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function existingIdentities(collection) {
  const directory = path.join(CONTENT_DIR, collection);
  const files = await readdir(directory);
  const urls = new Map();
  const sources = new Map();

  for (const file of files.filter((name) => name.endsWith('.md'))) {
    const content = await readFile(path.join(directory, file), 'utf8');
    const record = {
      path: path.join(directory, file),
      title: (() => {
        const match = content.match(/^title:\s*(.+)$/m);
        try { return match ? JSON.parse(match[1]) : ''; } catch { return ''; }
      })(),
    };
    const match = content.match(/^audioUrl:\s*"([^"]+)"/m);
    if (match) urls.set(audioKey(match[1]), record);
    const source = content.match(/^sourceUrl:\s*"([^"]+)"/m);
    if (source) sources.set(sourceKey(source[1]), record);
  }

  return { urls, sources };
}

function yamlValue(value) {
  if (typeof value === 'string') return JSON.stringify(value);
  return String(value);
}

function frontmatter(fields) {
  const lines = ['---'];
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined) continue;
    lines.push(`${key}: ${yamlValue(value)}`);
  }
  lines.push('---', '');
  return lines.join('\n');
}

export function replaceFrontmatterTitle(content, title) {
  return content.replace(/^title:\s*.+$/m, `title: ${yamlValue(title)}`);
}

async function run() {
  await mkdir(path.join(CONTENT_DIR, 'podcast'), { recursive: true });
  await mkdir(path.join(CONTENT_DIR, 'writing'), { recursive: true });
  const podcast = await existingIdentities('podcast');
  const writing = await existingIdentities('writing');

  const added = { podcast: 0, writing: 0 };
  const skipped = { podcast: 0, writing: 0 };
  const updatedTitles = { podcast: 0, writing: 0 };
  let truncatedCount = 0;
  const failedFeeds = [];

  for (const feed of FEEDS) {
    let items;
    try {
      items = await fetchFeed(feed.url);
    } catch (err) {
      if (feed.source === 'substack') {
        try {
          items = await fetchSubstackAPI();
          console.warn(`[fetch-feeds] Substack RSS unavailable (${err.message}); using Substack's public API`);
        } catch (fallbackError) {
          try {
            items = await fetchSubstackReader();
            console.warn(`[fetch-feeds] Substack API unavailable (${fallbackError.message}); using public feed relay`);
          } catch (readerError) {
            console.error(`[fetch-feeds] substack unreachable: RSS ${err.message}; API ${fallbackError.message}; relay ${readerError.message}`);
            failedFeeds.push(feed.source);
            continue;
          }
        }
      } else {
        console.error(`[fetch-feeds] ${feed.source} unreachable: ${err.message}`);
        failedFeeds.push(feed.source);
        continue;
      }
    }

    for (const item of items) {
      const title = textOf(item.title) || 'Untitled';
      const link = textOf(item.link) || textOf(item.guid) || '';
      const pubDate = textOf(item.pubDate);
      const date = pubDate ? new Date(pubDate) : new Date();
      const enclosure = getEnclosure(item);
      const isEpisode = Boolean(enclosure);
      const collection = isEpisode ? 'podcast' : 'writing';
      const audioUrl = enclosure?.['@_url'];

      // Episode titles can be revised after publication. The enclosure URL is
      // stable, so use it as the episode identity and avoid creating a second
      // page when only the title changes.
      const identities = isEpisode ? podcast : writing;
      const existing = identities.sources.get(sourceKey(link))
        ?? (isEpisode && audioUrl ? identities.urls.get(audioKey(audioUrl)) : undefined);
      if (existing) {
        // Keep feed-owned titles current while preserving the stable page URL,
        // hand-edited content, and all other frontmatter.
        if ((isEpisode || feed.source === 'substack') && existing.title !== title) {
          const content = await readFile(existing.path, 'utf8');
          await writeFile(existing.path, replaceFrontmatterTitle(content, title), 'utf8');
          existing.title = title;
          updatedTitles[collection]++;
        }
        skipped[collection]++;
        continue;
      }

      let slug = slugify(title);
      let filePath = path.join(CONTENT_DIR, collection, `${slug}.md`);
      if (await fileExists(filePath)) {
        slug = collisionSlug(slug, sourceKey(link));
        filePath = path.join(CONTENT_DIR, collection, `${slug}.md`);
      }

      if (await fileExists(filePath)) {
        skipped[collection]++;
        continue;
      }

      const descriptionHtml = textOf(item.description);
      const contentEncodedHtml = textOf(item['content:encoded']);

      let body = '';
      let truncated;
      let derivedDescriptionSource = '';

      if (isEpisode) {
        const summary = textOf(item['itunes:summary']) || descriptionHtml;
        const raw = summary || descriptionHtml;
        // Cut Ayush's own subscribe/social outro before it ever reaches the
        // file — never Ayush's promo boilerplate, never a guest's own
        // attribution (see stripPromoBoilerplate's marker rules).
        body = stripPromoBoilerplate(raw).cleaned;
        derivedDescriptionSource = body;
      } else {
        const plainContent = stripHtml(contentEncodedHtml);
        const plainDescription = stripHtml(descriptionHtml);
        const isTruncated = Boolean(
          plainDescription &&
            (!plainContent || plainContent.length < plainDescription.length * TRUNCATION_RATIO)
        );
        truncated = isTruncated;
        if (isTruncated) truncatedCount++;
        body = contentEncodedHtml || descriptionHtml;
        derivedDescriptionSource = descriptionHtml || contentEncodedHtml;
      }

      const fields = {
        title,
        slug,
        date: date.toISOString(),
        description: toDescription(derivedDescriptionSource),
        sourceUrl: link,
        ...(isEpisode
          ? { duration: normalizeDuration(item['itunes:duration']), audioUrl }
          : { truncated }),
        featured: false,
      };

      await writeFile(filePath, frontmatter(fields) + body.trim() + '\n', 'utf8');
      const record = { path: filePath, title };
      identities.sources.set(sourceKey(link), record);
      if (isEpisode && audioUrl) identities.urls.set(audioKey(audioUrl), record);
      added[collection]++;
    }
  }

  console.log(`Podcast: ${added.podcast} added, ${skipped.podcast} already present`);
  console.log(`Podcast titles refreshed from feed: ${updatedTitles.podcast}`);
  console.log(`Substack titles refreshed from feed: ${updatedTitles.writing}`);
  console.log(`Writing: ${added.writing} added, ${skipped.writing} already present`);
  console.log(`Truncated (paywall-length) writing items this run: ${truncatedCount}`);
  if (failedFeeds.length) {
    console.error(`Feeds unreachable this run (skipped, existing content untouched): ${failedFeeds.join(', ')}`);
    if (process.argv.includes('--strict')) process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run().catch((error) => { console.error(error); process.exitCode = 1; });
}
