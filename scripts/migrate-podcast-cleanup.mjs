#!/usr/bin/env node
// One-off migration: strip Ayush's own promo/subscribe boilerplate from
// already-generated podcast files (scripts/fetch-feeds.mjs now does this for
// new items going forward; this catches up the 168 that predate it).
//
// Touches ONLY `description` and the body. Every other frontmatter line —
// title, slug, date, sourceUrl, duration, audioUrl, and critically the
// hand-tagged `theme`/`featured` — is preserved byte-for-byte, line for
// line, whether or not this file needed cleaning. A file with nothing to
// clean is not rewritten at all (no touched mtime, no no-op diff).
//
// Safe to run more than once: stripPromoBoilerplate() is idempotent on
// already-clean text, so a second run reports 0 changed.

import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { toDescription, stripPromoBoilerplate } from './lib/feedContent.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const PODCAST_DIR = path.join(ROOT, 'src', 'content', 'podcast');

function splitFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) throw new Error('No frontmatter block found');
  return { fmBlock: match[1], body: match[2] };
}

// One entry per frontmatter line, keeping the ORIGINAL line text so any
// field we don't explicitly touch is written back verbatim.
function parseFrontmatterLines(fmBlock) {
  return fmBlock.split('\n').map((line) => {
    const idx = line.indexOf(':');
    const key = line.slice(0, idx).trim();
    const rawValue = line.slice(idx + 1).trim();
    return { key, rawValue, line };
  });
}

function unquoteYamlString(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

// Would applying the current cleanup rule change this body, or does the
// current description already show a marker/bare-URL fragment? Used for
// both the before-count and the post-migration verification pass.
function isAffected(body, description) {
  const { changed } = stripPromoBoilerplate(body);
  const descLooksAffected =
    /podcast info:|connect:|(^|\s)info:/i.test(description || '') ||
    /(open\.spotify\.com|podcasts\.apple\.com|apple\.co|instagram\.com|linkedin\.com)/i.test(description || '');
  return { bodyAffected: changed, descAffected: descLooksAffected };
}

async function scan() {
  const files = (await readdir(PODCAST_DIR)).filter((f) => f.endsWith('.md'));
  let bodies = 0;
  let descriptions = 0;
  for (const file of files) {
    const raw = await readFile(path.join(PODCAST_DIR, file), 'utf8');
    const { fmBlock, body } = splitFrontmatter(raw);
    const fields = parseFrontmatterLines(fmBlock);
    const description = unquoteYamlString(fields.find((f) => f.key === 'description')?.rawValue ?? '');
    const { bodyAffected, descAffected } = isAffected(body.trim(), description);
    if (bodyAffected) bodies++;
    if (descAffected) descriptions++;
  }
  return { total: files.length, bodies, descriptions };
}

async function migrate() {
  const files = (await readdir(PODCAST_DIR)).filter((f) => f.endsWith('.md'));
  let bodiesChanged = 0;
  let descriptionsChanged = 0;
  let filesRewritten = 0;

  for (const file of files) {
    const filePath = path.join(PODCAST_DIR, file);
    const raw = await readFile(filePath, 'utf8');
    const { fmBlock, body } = splitFrontmatter(raw);
    const fields = parseFrontmatterLines(fmBlock);

    const { cleaned, changed: bodyChanged } = stripPromoBoilerplate(body.trim());
    const newDescription = toDescription(cleaned);

    const descField = fields.find((f) => f.key === 'description');
    const oldDescription = descField ? unquoteYamlString(descField.rawValue) : '';
    const descriptionChanged = newDescription !== oldDescription;

    if (!bodyChanged && !descriptionChanged) continue; // untouched — no rewrite at all

    if (bodyChanged) bodiesChanged++;
    if (descriptionChanged) descriptionsChanged++;
    filesRewritten++;

    const newFields = fields.map((f) =>
      f.key === 'description' ? `description: ${JSON.stringify(newDescription)}` : f.line
    );

    const newRaw = `---\n${newFields.join('\n')}\n---\n\n${cleaned}\n`;
    await writeFile(filePath, newRaw, 'utf8');
  }

  return { filesRewritten, bodiesChanged, descriptionsChanged, total: files.length };
}

async function run() {
  const before = await scan();
  console.log(
    `Before: ${before.bodies} of ${before.total} bodies affected, ${before.descriptions} descriptions affected`
  );

  const result = await migrate();
  console.log(
    `Migrated: ${result.filesRewritten} files rewritten (${result.bodiesChanged} bodies cleaned, ${result.descriptionsChanged} descriptions updated)`
  );

  const after = await scan();
  console.log(
    `After: ${after.bodies} of ${after.total} bodies affected, ${after.descriptions} descriptions affected`
  );
}

run();
