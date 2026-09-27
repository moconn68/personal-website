import { getCollection, type CollectionEntry } from 'astro:content';
export { TEMPLATES, templateToComponentName, type Template } from './templates';

export type SectionEntry = CollectionEntry<'sections'>;

/**
 * All registered sections, sorted by `order` ascending. The registry's one read API.
 * Enforces cross-entry invariants (per-entry ones live in the content.config.ts
 * schema); any violation throws, failing the build.
 */
export async function getSections(): Promise<SectionEntry[]> {
  const all = await getCollection('sections');
  const bySlug = new Map<string, string>();
  const byOrder = new Map<number, string>();
  for (const entry of all) {
    const { slug, order } = entry.data;
    // entry.id is the filename without extension (see generateId in content.config.ts).
    if (entry.id !== slug) {
      throw new Error(`Section file "${entry.id}.md" declares slug "${slug}"; filename and slug must match.`);
    }
    const slugOwner = bySlug.get(slug);
    if (slugOwner !== undefined) {
      throw new Error(`Duplicate section slug "${slug}" in "${slugOwner}.md" and "${entry.id}.md".`);
    }
    bySlug.set(slug, entry.id);
    const orderOwner = byOrder.get(order);
    if (orderOwner !== undefined) {
      throw new Error(`Duplicate section order ${order} in "${orderOwner}.md" and "${entry.id}.md".`);
    }
    byOrder.set(order, entry.id);
  }
  if (!bySlug.has('home')) {
    throw new Error('Registry must contain exactly one section with slug "home"; found none.');
  }
  return [...all].sort((a, b) => a.data.order - b.data.order);
}

/** THE slug→URL mapping. Routes, nav, active-state, canonical, and sitemap all use this. */
export function sectionPath(entry: SectionEntry): string {
  return entry.data.slug === 'home' ? '/' : `/${entry.data.slug}/`;
}
