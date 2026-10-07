import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import sharp from 'sharp';
import { readFile } from 'node:fs/promises';

// Static PNGs are built alongside each page, including newly imported posts.
export async function getStaticPaths() {
  const pages = ['home', 'podcast', 'writing', 'books', 'about', 'cv'];
  const staticPages = pages.map((path) => ({ params: { path }, props: {
    title: path === 'home' ? 'Ayush Prakash' : path === 'cv' ? 'Curriculum vitae' : path[0].toUpperCase() + path.slice(1),
  } }));
  const collections = await Promise.all(['podcast', 'writing'].map(async (collection) =>
    (await getCollection(collection as 'podcast' | 'writing')).map((entry) => ({
      params: { path: `${collection}/${entry.data.slug}` }, props: { title: entry.data.title },
    }))
  ));
  return [...staticPages, ...collections.flat()];
}

const escape = (text: string) => text.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]!);
export const GET: APIRoute = async ({ props }) => {
  const mark = await sharp(await readFile('public/favicon.svg')).resize(100, 100).png().toBuffer();
  let size = 66;
  let title;
  do {
    title = await sharp({ text: { text: `<span foreground="#1A1A18">${escape(props.title)}</span>`, font: `serif ${size}`, width: 1056, rgba: true } }).png().toBuffer({ resolveWithObject: true });
    size -= 2;
  } while (title.info.height > 310 && size >= 28);
  const label = await sharp({ text: { text: '<span foreground="#78766F">AYUSH PRAKASH</span>', font: 'sans 24', rgba: true } }).png().toBuffer();
  const domain = await sharp({ text: { text: '<span foreground="#78766F">ayushprakash.com</span>', font: 'sans 24', rgba: true } }).png().toBuffer();
  const png = await sharp({ create: { width: 1200, height: 630, channels: 4, background: '#FFFFFF' } }).composite([
    { input: mark, left: 65, top: 45 }, { input: label, left: 190, top: 82 },
    { input: title.data, left: 72, top: 205 }, { input: domain, left: 72, top: 558 },
  ]).png().toBuffer();
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
