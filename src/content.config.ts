import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';
import { TEMPLATES } from './config/templates';

// Slugs that would collide with a hand-written route in src/pages/.
const RESERVED_SLUGS = new Set(['404']);

// Only https URLs on the expected host pass: these values are rendered as raw
// `href`s and emitted into JSON-LD, so `javascript:`/`data:`/`mailto:` etc.
// must never validate.
const githubUrl = z.url({ protocol: /^https$/, hostname: /^(www\.)?github\.com$/ });
const linkedinUrl = z.url({ protocol: /^https$/, hostname: /^(www\.)?linkedin\.com$/ });

const sections = defineCollection({
  // The id comes from the FILENAME, not frontmatter. Astro's default glob
  // generateId uses frontmatter `slug` as the id when present, which would make
  // the filename/slug guard in sections.ts a tautology.
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/sections',
    generateId: ({ entry }) => entry.replace(/\.md$/, ''),
  }),
  schema: z
    .object({
      slug: z
        .string()
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug: lowercase alphanumeric words joined by single hyphens')
        .refine((s) => !RESERVED_SLUGS.has(s), 'slug: reserved (collides with a src/pages route)'),
      title: z.string().trim().min(1),
      navLabel: z.string().trim().min(1),
      order: z.number().int().positive(),
      template: z.enum(TEMPLATES),
      description: z.string().trim().min(1).max(160), // doubles as meta description; ≤160 is enforced at the boundary
      github: githubUrl.optional(), // home-only
      linkedin: linkedinUrl.optional(), // home-only
      specs: z.array(z.object({ label: z.string().trim().min(1), value: z.string().trim().min(1) })).optional(), // home and about
    })
    // Per-entry invariants. Cross-entry ones (exactly one home, unique
    // slug/order) live in getSections() in src/config/sections.ts.
    .superRefine((data, ctx) => {
      const isHomeSlug = data.slug === 'home';
      const isHomeTemplate = data.template === 'home';
      if (isHomeSlug !== isHomeTemplate) {
        ctx.addIssue({
          code: 'custom',
          path: ['template'],
          message: 'slug "home" and template "home" must be used together',
        });
      }
      if (!isHomeSlug) {
        for (const key of ['github', 'linkedin'] as const) {
          if (data[key] !== undefined) {
            ctx.addIssue({ code: 'custom', path: [key], message: `${key} is only allowed on the home section` });
          }
        }
      }
      if (!isHomeSlug && data.slug !== 'about' && data.specs !== undefined) {
        ctx.addIssue({ code: 'custom', path: ['specs'], message: 'specs is only allowed on the home and about sections' });
      }
    }),
});

// Blog-style project write-ups. The entry id (filename) is the URL slug under
// the Projects section: src/content/projects/murmur.md -> /projects/murmur/.
// Cover images are validated and optimized by Astro via the image() helper.
const projects = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/projects',
    generateId: ({ entry }) => entry.replace(/\.md$/, ''),
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string().trim().min(1),
      summary: z.string().trim().min(1).max(160), // card line and meta description
      date: z.coerce.date(),
      tags: z.array(z.string().trim().min(1)).min(1),
      cover: image(),
      coverAlt: z.string().trim().min(1),
      liveUrl: z.url({ protocol: /^https$/ }).optional(),
    }),
});

export const collections = { sections, projects };
