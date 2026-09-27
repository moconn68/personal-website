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
    }),
});

export const collections = { sections };
