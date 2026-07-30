import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// CLAUDE.md's architecture section, verbatim. Human–AI Relationships uses an
// en dash, which the copy rules don't forbid (only em dashes are banned).
export const THEMES = [
  'Cognition & Development',
  'Minds & Consciousness',
  'Human–AI Relationships',
  'Governance & Society',
  'Youth & Education',
] as const;

const baseSchema = {
  title: z.string(),
  slug: z.string(),
  date: z.coerce.date(),
  description: z.string(),
  sourceUrl: z.string().url(),
  theme: z.enum(THEMES).optional(),
  featured: z.boolean().default(false),
};

const podcast = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/podcast' }),
  schema: z.object({
    ...baseSchema,
    duration: z.string().optional(),
    audioUrl: z.string().url(),
  }),
});

const writing = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/writing' }),
  schema: z.object({
    ...baseSchema,
    truncated: z.boolean().default(false),
  }),
});

export const collections = { podcast, writing };
