# ayushprakash.com

Personal site of Ayush Prakash. A research identity page and a public archive of writing, podcast episodes, and books.

Built with [Astro](https://astro.build). Static output, deployed on Netlify.

## Develop

```bash
npm install
npm run dev      # local dev server
npm run build    # static build to dist/
npm run check    # astro check
npm run verify   # regression checks, build, links and sharing images
```

## Content

Podcast episodes and essays live in `src/content/` as markdown with frontmatter, generated from RSS by:

```bash
npm run content:fetch
```

The script is idempotent. It only adds items it has not seen, and never overwrites hand-edited frontmatter such as `theme` or `featured`.

Design system, architecture decisions, and copy rules are documented in `CLAUDE.md`.

## Sharing and updates

Sharing cards are prerendered PNG routes under `/share/`, using the existing AP favicon and page titles. New content receives a card automatically. Sharp is declared explicitly for this build step rather than relying on Astro's transitive dependency. Generated cards are not source assets.

The scheduled feed sync runs hourly, preserves existing content, identifies revised episodes by source/audio identity, and reports inaccessible feeds as failed runs after committing any successful imports. A new publication still depends on feed availability, GitHub scheduling and Netlify deployment. Run `npm run content:fetch -- --strict` to require both feeds locally.

Substack remains linked in the footer. `scripts/migrate-podcast-cleanup.mjs` is a historical, manually invoked migration, not part of normal builds. The design prototype and unreferenced unique images remain reference material.
