# ayushprakash.com

Personal site of Ayush Prakash. A research identity page and a public archive of writing, podcast episodes, and books.

The site's job: a fellowship committee member, journalist, or investor opens it and can name the research question within five seconds.

## The two source documents

- **`docs/design-reference/index.html`** — a complete, working, seven-page prototype. This is the design spec. It is not an inspiration board. Match its type scale, spacing, colour values, and component structure exactly. When a question about layout comes up, open this file and read the CSS rather than inventing an answer.
- **`docs/revamp-spec.md`** — all page copy. Use it verbatim. Do not paraphrase it, do not improve it, do not add transitional sentences.

If the two ever disagree, the prototype wins on layout and the spec wins on words.

---

## Audience

The primary reader is a fellowship or grant selection committee member. Secondarily a journalist, a programme officer, or an academic considering an advisory role. Not a recruiter, not a client, not a general audience. Every design and copy decision resolves in favour of that reader.

What that means in practice:

- **Every claim is checkable in one click.** A publication listed without a working outbound link is worth less than no publication, because a committee that cannot verify a claim discounts the whole page. Never ship `href="#"`. If a real URL does not exist yet, omit the item rather than linking it to nothing.
- **Placeholders never reach production.** A visible `[NAMES + ONE-LINE ROLES AS SECURED]` on the Research page reads as aspiration, not a research programme. If a section has no real content, remove the section and restore it when the content is real. This applies to the advisory circle above all.
- **Research identity leads, operator record supports.** Research sits second in the nav, ahead of Books. The Transcendence of Money is off-thesis: it gets a real page because it is a real book, and it never appears on the Research page or in Home's proof lines.
- **Status is stated, never implied.** "In progress → Nov 2026" beats "coming soon". Dates are real dates. The empty corrections log is a feature: its existence is the credibility signal, and it sits beside Methods rather than alone at the bottom.
- **Identity is machine-readable.** JSON-LD `Person` schema on every page, with `sameAs` pointing to ORCID, Google Scholar, LinkedIn, and Substack. Committees google people, and the knowledge panel is part of the first impression.
- **`/cv` is a permanent route.** It gets pasted into applications and must always be current. Treat it as a first-class page, not an afterthought.

## Design system

The register is editorial magazine typography, modelled on Kinfolk. Serif for display, sans for body and metadata, warm paper, hairline rules, and a lot of air. Restraint is the whole point. When in doubt, add whitespace and remove an element.

### Tokens

```
--paper:  #FDFCF9   warm off-white, never pure #fff
--ink:    #1A1A18   near-black, never pure #000
--muted:  #78766F   metadata, ledes, secondary text
--hair:   rgba(26,26,24,.20)   hairline dividers
--rule:   #1A1A18   1px section rules
```

Five values. No accent colour, no gradients, no drop shadows beyond the 1px seat under a book cover. No dark mode. The previous build shipped a dark-mode toggle whose dark styles were identical to its light styles; do not reintroduce it.

### Type

```
--serif: 'Canela Text','Domaine Display','Instrument Serif','Newsreader',Georgia,serif
--sans:  'Neue Montreal','PP Neue Montreal','Inter',-apple-system,sans-serif
```

Serif is for display only: headlines, card titles, row titles, section heads, pull statements, table body. Sans is for body copy, ledes, metadata, nav, and labels. Never serif for running body text. Never sans for a headline.

Display headings are uppercase with `line-height:1.12`. Descriptive second lines are sentence case in the same serif. That two-line pairing (caps title, sentence-case descriptor) is the signature move of this design and appears on every card and every row.

### The seven components

All seven are implemented in the prototype. Port them as Astro components with the same class names.

1. **`.feature`** — a book or project centred in a large amount of vertical air. Kicker, uppercase serif title, lede, cover image at `min(330px,72vw)`, then a `Buy | Read` line. Vertical padding is `clamp(70px,12vw,170px)`. The air is the design; do not compress it.
2. **`.strip`** — horizontal-scroll card row, cards at `clamp(210px,20vw,268px)`, 3:4 images. The next card must peek past the right edge. Never let it wrap into a grid; a wrapped 5+1 reads as broken.
3. **`.row`** — list row: square thumbnail, uppercase serif title, sentence-case serif descriptor, right-aligned sans metadata. Hairline rule between rows. Use `.row.noimg` where there is no image.
4. **`.proof`** — a label column at 150px and a serif statement. Home page only.
5. **`.sectionhead`** — serif heading left, sans link or count right, 1px rule beneath.
6. **`.filters` / `.tools`** — pill filters and a hairline-underlined search input with a Surprise Me button.
7. **`.banner` / `.aboutimgs`** — a 16:7 full-width image, and the asymmetric two-image About block where the second image is pushed down by `clamp(30px,8vw,120px)`.

### Imagery

Photography carries this design. Every image frame in the prototype is a real slot with a real aspect ratio, currently filled with generated placeholders in `docs/design-reference/img/`.

- Podcast cards and Start Here: 3:4, guest portraits
- Row thumbnails: 1:1
- Book covers: 2:3
- Banners: 16:7
- About: 4:3

Replace placeholders as real assets arrive. Do not change the aspect ratios to fit an image; crop the image to fit the ratio.

---

## Architecture

Astro with content collections. Static output. Deployed on Netlify.

- **Feeds are resolved at build time, never in the browser.** The previous build fetched Substack and Anchor RSS on every page load and parsed the XML client-side, which meant the site had no content of its own and its uptime was Substack's uptime. A build script pulls the feeds into local content files. Nothing on this site makes a network request at runtime.
- **Every page and every item has a real URL.** `/research`, `/podcast`, `/books`, `/writing/[slug]`, `/podcast/[slug]`. The previous build was a single URL with `useState` view switching, so no essay or episode could be linked, shared, or indexed. Each route must render complete HTML with its own `<title>`, meta description, and Open Graph tags.
- **Podcast versus writing is decided by `<enclosure type="audio/*">` and nothing else.** The previous build guessed with `title.includes("episode")` and misfiled essays.
- **Episode themes live in frontmatter**, not in a runtime filter. Five themes: Cognition & Development, Minds & Consciousness, Human–AI Relationships, Governance & Society, Youth & Education.
- **Anchor RSS returns full history. Substack RSS does not.** Anchor (`https://anchor.fm/s/4f9f9cb0/podcast/rss`) returned all 168 episodes back to Oct 2021. Substack (`https://ayushprakash.substack.com/feed`) returned exactly 20, which is its default cap. The archive API returns 22. Two posts are missing from the feed: "Do Androids Paint Electric Sheep?" (4 Sept 2024) and "Social Impact of Automation" (17 Sept 2024). Ayush has decided to leave both on Substack. Verified 30 July 2026.
- **Treat Substack RSS as an incremental update mechanism, not the archive.** Never let a sync delete or overwrite a post the feed no longer returns.
- **Substack RSS may truncate paywalled posts.** `content:encoded` carries the full body for public posts. If a post comes back short, keep the excerpt and link out rather than publishing a partial essay as if it were complete.

### Do not add

React, a router library, a state management library, an animation library, an analytics SDK, a UI component library, or any dependency whose purpose is a feature not named in `docs/revamp-spec.md`. The old `package.json` shipped `@google/genai` and `motion` that were imported nowhere; do not repeat that.

---

## Working style

- Show me a plan before multi-file changes. One page per session, one branch per page.
- Prefer deleting code to adding it. This site got worse by accumulating scaffolding.
- Every new dependency needs a one-line justification in the PR.
- Run `npx astro check` and `npx astro build` before saying a change is done.
- Never commit or push unless I ask.

## Copy rules

- No em dashes.
- Never use: delve, tapestry, testament, underscore, moreover, furthermore, crucial, pivotal, realm, landscape, navigate, foster, leverage, robust, seamless, multifaceted, nuanced, intricate, vibrant, boasts, "stands as."
- Numbers are precise. 150+ episodes, not "many episodes." $3.5M, not "millions."
- Start with the fact. Never open with context about why the sentence exists.
- Read it out loud. If it sounds generated, cut it.
