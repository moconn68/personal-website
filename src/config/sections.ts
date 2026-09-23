import { getCollection, type CollectionEntry } from 'astro:content';
export { TEMPLATES, templateToComponentName, type Template } from './templates';

export type SectionEntry = CollectionEntry<'sections'>;

/** All registered sections, sorted by `order` ascending. The registry's one read API. */
export async function getSections(): Promise<SectionEntry[]> {
  const all = await getCollection('sections');
  for (const entry of all) {
    if (entry.id !== entry.data.slug) {
      throw new Error(`Section file "${entry.id}" declares slug "${entry.data.slug}" — filename and slug must match.`);
    }
  }
  return [...all].sort((a, b) => a.data.order - b.data.order);
}

/** THE slug→URL mapping. Routes, nav, active-state, canonical, and sitemap all use this. */
export function sectionPath(entry: SectionEntry): string {
  return entry.data.slug === 'home' ? '/' : `/${entry.data.slug}/`;
}