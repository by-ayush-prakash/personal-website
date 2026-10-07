import test from 'node:test';
import assert from 'node:assert/strict';
import { sourceKey, audioKey, collisionSlug } from './lib/feedIdentity.mjs';
import { fetchFeed, fetchSubstackAPI, replaceFrontmatterTitle } from './fetch-feeds.mjs';

test('episode identity survives revised titles, query strings and audio destinations', () => {
  assert.equal(sourceKey('https://podcasters.spotify.com/pod/show/show/episodes/Old-name-e3pnipl'), sourceKey('https://podcasters.spotify.com/pod/show/show/episodes/New-name-e3pnipl?utm_source=x'));
  assert.equal(audioKey('https://anchor.fm/s/x/podcast/play/123/old.mp3'), audioKey('https://anchor.fm/s/x/podcast/play/123/new.mp3'));
  assert.equal(sourceKey('https://example.substack.com/p/story?utm_source=x'), sourceKey('https://example.substack.com/p/story'));
});

test('same-title posts get stable, distinct collision slugs', () => {
  assert.notEqual(collisionSlug('a-title', 'one'), collisionSlug('a-title', 'two'));
  assert.equal(collisionSlug('a-title', 'one'), collisionSlug('a-title', 'one'));
});

test('revised podcast titles update frontmatter while preserving episode URLs and content', () => {
  const original = '---\ntitle: "Old title"\nslug: "stable-old-title"\nfeatured: true\n---\nEpisode text.';
  assert.equal(
    replaceFrontmatterTitle(original, 'Guest: The New Title'),
    '---\ntitle: "Guest: The New Title"\nslug: "stable-old-title"\nfeatured: true\n---\nEpisode text.'
  );
});

test('Substack API fallback imports only published public posts', async () => {
  const posts = await fetchSubstackAPI(async () => new Response(JSON.stringify([
    { id: 1, title: 'Public post', canonical_url: 'https://example.substack.com/p/public', post_date: '2026-10-01', description: 'A description', body_html: '<p>Body</p>', is_published: true, audience: 'everyone' },
    { id: 2, title: 'Paid post', canonical_url: 'https://example.substack.com/p/paid', is_published: true, audience: 'only_paid' },
    { id: 3, title: 'Draft', canonical_url: 'https://example.substack.com/p/draft', is_published: false, audience: 'everyone' },
  ])));
  assert.equal(posts.length, 1);
  assert.equal(posts[0].title, 'Public post');
  assert.equal(posts[0].link, 'https://example.substack.com/p/public');
  assert.equal(posts[0]['content:encoded'], '<p>Body</p>');
});

test('an inaccessible or malformed feed is reported instead of returning empty success', async () => {
  await assert.rejects(fetchFeed('https://example.test/feed', async () => new Response('', { status: 403 })), /403/);
  await assert.rejects(fetchFeed('https://example.test/feed', async () => new Response('<html>Blocked</html>')), /no RSS items/);
  let headers;
  const items = await fetchFeed('https://example.test/feed', async (_url, options) => {
    headers = options.headers;
    return new Response('<rss><channel><item><title>New post</title></item></channel></rss>');
  });
  assert.equal(items.length, 1);
  assert.equal(headers['User-Agent'], 'Mozilla/5.0');
});
