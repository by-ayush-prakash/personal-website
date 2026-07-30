# ayushprakash.com

Personal site of Ayush Prakash. A research identity page and a public archive of writing, podcast episodes, and books.

Built with [Astro](https://astro.build). Static output, deployed on Netlify.

## Develop

```bash
npm install
npm run dev      # local dev server
npm run build    # static build to dist/
npm run check    # astro check
```

## Content

Podcast episodes and essays live in `src/content/` as markdown with frontmatter, generated from RSS by:

```bash
npm run content:fetch
```

The script is idempotent. It only adds items it has not seen, and never overwrites hand-edited frontmatter such as `theme` or `featured`.

Design system, architecture decisions, and copy rules are documented in `CLAUDE.md`.
