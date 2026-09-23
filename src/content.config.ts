import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';
import { TEMPLATES } from './config/templates';

const sections = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/sections' }),
  schema: z.object({
    slug: z.string().regex(/^[a-z0-9-]+$/, 'slug: lowercase, digits, hyphens only'),
    title: z.string().min(1),
    navLabel: z.string().min(1),
    order: z.number().int().positive(),
    template: z.enum(TEMPLATES),
    description: z.string().min(1).max(160), // doubles as meta description (SEO-7); ≤160 is enforced at the boundary
    github: z.string().url().optional(), // home-only; placeholder URL pattern until T-23 (§4.4)
    linkedin: z.string().url().optional(), // home-only
  }),
});

export const collections = { sections };