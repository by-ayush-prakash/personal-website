#!/usr/bin/env node
// Build-time content fetch. Run manually (`npm run content:fetch`), never from
// `astro build` itself — the generated .md files are committed so the site
// still builds when a feed is unreachable (CLAUDE.md's architecture rule).
//
// Idempotent by construction: a destination file is only ever written once.
// If `src/content/<collection>/<slug>.md` already exists, this run skips it
// entirely — no re-write, no field merge — so hand-edited frontmatter
// (theme, featured) can never be clobbered by a re-run.

import { writeFile, mkdir, access, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { XMLParser } from 'fast-xml-parser';
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

async function fetchFeed(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const xml = await res.text();
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
  const data = parser.parse(xml);
  const items = data?.rss?.channel?.item;
  if (!items) return [];
  return Array.isArray(items) ? items : [items];
}

async function fileExists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function existingPodcastAudioUrls() {
  const directory = path.join(CONTENT_DIR, 'podcast');
  const files = await readdir(directory);
  const urls = new Set();

  for (const file of files.filter((name) => name.endsWith('.md'))) {
    const content = await readFile(path.join(directory, file), 'utf8');
    const match = content.match(/^audioUrl:\s*"([^"]+)"/m);
    if (match) urls.add(match[1]);
  }

  return urls;
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

async function run() {
  await mkdir(path.join(CONTENT_DIR, 'podcast'), { recursive: true });
  await mkdir(path.join(CONTENT_DIR, 'writing'), { recursive: true });
  const podcastAudioUrls = await existingPodcastAudioUrls();

  const added = { podcast: 0, writing: 0 };
  const skipped = { podcast: 0, writing: 0 };
  let truncatedCount = 0;
  const failedFeeds = [];

  for (const feed of FEEDS) {
    let items;
    try {
      items = await fetchFeed(feed.url);
    } catch (err) {
      console.error(`[fetch-feeds] ${feed.source} unreachable: ${err.message}`);
      failedFeeds.push(feed.source);
      continue;
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
      if (isEpisode && audioUrl && podcastAudioUrls.has(audioUrl)) {
        skipped.podcast++;
        continue;
      }

      const slug = slugify(title);
      const filePath = path.join(CONTENT_DIR, collection, `${slug}.md`);

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
      if (isEpisode && audioUrl) podcastAudioUrls.add(audioUrl);
      added[collection]++;
    }
  }

  console.log(`Podcast: ${added.podcast} added, ${skipped.podcast} already present`);
  console.log(`Writing: ${added.writing} added, ${skipped.writing} already present`);
  console.log(`Truncated (paywall-length) writing items this run: ${truncatedCount}`);
  if (failedFeeds.length) {
    console.log(`Feeds unreachable this run (skipped, existing content untouched): ${failedFeeds.join(', ')}`);
  }
}

run();
