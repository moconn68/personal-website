import { getCollection, type CollectionEntry } from 'astro:content';
import { getSections, sectionPath } from './sections';

export type ProjectEntry = CollectionEntry<'projects'>;

/** All projects, newest first. The projects collection's one read API. */
export async function getProjects(): Promise<ProjectEntry[]> {
  const all = await getCollection('projects');
  return [...all].sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

/** Project URL, nested under the Projects section's own path: '/projects/{id}/'. */
export async function projectPath(entry: ProjectEntry): Promise<string> {
  const section = (await getSections()).find((s) => s.data.template === 'projects');
  if (!section) throw new Error('Registry has no section using the "projects" template.');
  return `${sectionPath(section)}${entry.id}/`;
}
