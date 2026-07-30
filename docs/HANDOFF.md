# ayushprakash.com — session handoff

Context for picking this project up in a new chat. Written 30 July 2026.

---

## What happened

Rebuilt ayushprakash.com from a Google AI Studio React SPA into a static Astro site. **The new site is live.** Repo: `github.com/by-ayush-prakash/personal-website`, local clone at `~/Documents/dev/personal-website`, branch `main`, auto-deployed by Netlify on push.

**Why the rebuild, not a refactor.** The old site had no router. `App.tsx` held the current post in `useState` and swapped views, so the entire site was one URL. No essay or episode could be linked, shared, or indexed. Google saw an empty `<div id="root">`. It also owned no content: both RSS feeds were fetched in the browser on every page load and parsed with `DOMParser`, so the site's uptime was Substack's uptime and there was nowhere to store an episode tag.

---

## Who this site is for

**Fellowship and grant selection committees.** Secondarily journalists, programme officers, and academics considering an advisory role. Not recruiters, not clients. Ayush is positioning both his LinkedIn and this site for fellowship applications.

This is written up as an "Audience" section in `CLAUDE.md` in the repo, and it drives real rules: every claim must be checkable in one click, never ship `href="#"`, never ship a visible `[PLACEHOLDER]`, research identity leads and the operator record supports.

---

## Stack and architecture

Astro, static output, no client framework. Netlify builds on push (`npm run build` → `dist/`).

- **Content lives in the repo** as markdown with frontmatter in `src/content/podcast/` (168 files) and `src/content/writing/` (20 files).
- `scripts/fetch-feeds.mjs` (`npm run content:fetch`) pulls both RSS feeds at build time. It is idempotent, only adds unseen items, and **never overwrites hand-edited frontmatter** like `theme` or `featured`. This was verified by hand-editing a file and re-running.
- Podcast vs writing is decided by `<enclosure type="audio/*">` only, never by title text. The old build guessed with `title.includes("episode")` and misfiled essays.
- `src/lib/themeImage.ts` maps a theme to its image: `/img/theme-{slug}-{card|sq|wide}.jpg`. Every card, row thumbnail, and Open Graph image reads from it. Untagged items fall back to `general`.
- `src/scripts/archiveFilters.ts` powers theme filters, search, and Surprise Me with vanilla DOM, no framework. Its markup contract: `[data-archive]` must be on the **wrapper** containing the filters, tools, and rows, not on the `.filters` div itself. That bug shipped once and broke every filter button.

Routes: `/`, `/research`, `/podcast`, `/podcast/[slug]`, `/writing`, `/writing/[slug]`, `/books`, `/speaking`, `/about`, `/cv`. Roughly 196 pages.

---

## Design system

Base register is **Kinfolk**: serif for display, sans for body and metadata, warm paper, hairline rules, heavy whitespace. Three devices were then borrowed from **COLLINS**:

1. **One full-bleed dark band**, used exactly once, wrapping the Core Question on `/research`. Uses `.band` + `.band-inner`. Body has `overflow-x: clip` because the technique relies on `50vw`.
2. **Pill CTAs** (`.pill`, `.pill--ghost`) replacing hairline-underlined links on every real call to action.
3. **Large centred serif footer nav** (`.footnav`) closing with Research / Podcast / Writing.

Tokens:
```
--paper #FDFCF9   --ink #1A1A18   --muted #78766F   --hair rgba(26,26,24,.20)
--serif 'Canela Text','Domaine Display','Instrument Serif','Newsreader',Georgia,serif
--sans  'Neue Montreal','PP Neue Montreal','Inter',-apple-system,sans-serif
```

`text-wrap: balance` on headings and `text-wrap: pretty` on body copy handle orphans and widows globally. Do not hand-tune `max-width` per heading to fix hanging words.

A complete working prototype of the design lives at `docs/design-reference/index.html` in the repo. It is the visual spec; read its CSS rather than inventing values.

---

## Content state

- **168 podcast episodes**, back to Oct 2021. Anchor RSS returns full history.
- **20 essays.** Substack RSS caps at 20; the real archive is 26. **Six posts are missing**, including the two earliest AI pieces from Sept 2024.
- **62 episodes tagged** across five themes: Governance & Society 22, Youth & Education 12, Human–AI Relationships 11, Minds & Consciousness 9, Cognition & Development 8. The other 106 remain reachable under ALL.
- **Six episodes flagged `featured: true`** for the Start Here strip: Friston, Renee Sieber, Fenwick McKelvey, Samir Chopra, Ashley Rankin, Ran Anbar.
- Promo boilerplate (Spotify/Apple/Instagram subscribe links) was stripped from all 188 bodies and 34 meta descriptions.

---

## Established facts and URLs

| | |
| --- | --- |
| ORCID | `0009-0003-5287-9694` (public; employment left empty on purpose) |
| Friston essay | "The Infinity of the Brain and the Void of the Machine", The Montreal Review, `https://www.themontrealreview.com/Articles/the_infinity_of_the_brain_and_the_void_of_the_machine.php`. He was invited to develop a named series and related symposiums. |
| Anbar essay | "The Risks of AI and Social Media for the Developing Brain", Psychology Today, **published Nov 2025, not forthcoming**. `https://www.psychologytoday.com/sg/blog/understanding-hypnosis/202511/the-risks-of-ai-and-social-media-for-the-developing-brain` |
| AI for Gen Z | `https://www.amazon.com/dp/0981182135`. Subtitle: *What Digital Technology Is Doing to Our Brains, Our Future, and the Generation Coming of Age Inside It* |
| Contact | `ayush@innovatingfuture.com` |
| Socials | Substack `ayushprakash.substack.com`, YouTube `@ayushprakashofficial`, LinkedIn `/in/prakash-ayush/` |
| Employer | New Sapience, `newsapience.com`. Chief of Staff Dec 2025–present; Creative Director Feb 2023–Dec 2025 ($3.5M across two rounds, 2,000+ investors) |
| Education | BA Philosophy, Toronto Metropolitan University, 2023 |

---

## Copy decisions made this session

- **Hero was rewritten.** Now: *"A generation is coming of age inside a technology nobody has finished understanding."* Lede: *"I wrote AI for Gen Z on what that does to our brains, our future, and the people growing up inside it. The work continues through 150+ conversations and a research report publishing November 2026."* The kicker was removed. Earlier drafts opened with "I study how", which breaks his own rule about starting with the fact.
- **"Person-like AI" was retired site-wide**, replaced with "conversational AI" in all ten places including the Research core question. He rejected the phrase as not making sense.
- **"150+ conversations"** in all claim-shaped copy. The literal `168` remains only in the All Episodes count and the CV, where precision helps.
- Copy rules from `CLAUDE.md`: **no em dashes**, precise numbers, start with the fact, and a banned-word list (delve, tapestry, testament, underscore, moreover, furthermore, crucial, pivotal, realm, landscape, navigate, foster, leverage, robust, seamless, multifaceted, nuanced, intricate, vibrant, boasts, "stands as").

---

## Open items

**Content**
- Guest portraits. All imagery is theme-level; no individual guest photos anywhere.
- Real headshot for About.
- Advisory circle names on `/research`. The section currently states "in formation" with a source TODO. Do not ship a visible placeholder.
- Pre-order link for *The Transcendence of Money* (Nov 2026). Currently a source TODO.

**Code and quality, from an audit that was interrupted mid-cleanup**
- **9 of 13 `<img>` tags on authored pages have empty `alt`.** `themeAlt()` exists in `src/lib/themeImage.ts` and is unused. Wire it.
- **140 hotlinks to `substackcdn.com`** across 15 essay bodies, plus 3 YouTube redirect tracking URLs. Fragile and leeches their bandwidth.
- **1 empty and several very short meta descriptions** (0 to 51 chars) on individual items. Needs a title-derived fallback in the `[slug]` pages.
- `docs/` is 1.8M in the repo (the design reference and its 16 images). Decide whether it ships.
- `_to_delete/` on disk holds junk and 8 orphaned placeholder images. Now gitignored. **Needs `rm -rf _to_delete` run manually** (see gotchas).
- The display serif is Instrument Serif standing in for a licensed face. Canela or Domaine, roughly $200–400, is the single biggest remaining gap between this and the Kinfolk reference.
- Check image licences and consider a photographer credit line. The four theme photos appear to be Unsplash.

---

## Gotchas that cost real time

1. **Never run `git` through `device_bash`.** The bridge mounts the folder in a way that cannot unlink `.git/*.lock`, so every git command leaves a stale lock that blocks the user's next command. This happened three times. Git is the user's job.
2. **`device_bash` cannot delete files.** `rm` fails with "Operation not permitted". Use `mv` into a folder inside the mount instead, then have the user delete it.
3. **The cloud sandbox blocks GitHub and the npm registry.** Cannot clone, cannot `npm install`, cannot push. All builds run on the user's Mac.
4. **Builds cannot be verified from the sandbox.** `node_modules` are macOS arm64; `device_bash` is a Linux VM, so `astro build` fails there with a compiler-binding error. That failure is an artefact, not a real bug.
5. **Tell the user to paste terminal commands one line at a time.** Pasting a block means the first command fails and every subsequent one fires anyway against a broken state, producing a wall of identical errors.
6. **WebFetch caches for 15 minutes.** A stale homepage response made a successful deploy look like a failure.

---

## Working style

Ayush wants the direct answer first, one strong recommendation rather than three options, and no hedging. He will say when framing is off and expects the same in return. Once he has decided, stop relitigating.

He got visibly frustrated twice this session, both times because polish tasks were stacked onto a site that was already shippable, and because he could not see the thing. **Bias hard toward showing him the running site over describing it.** If something is done, say it is done and give him the command to look at it.
