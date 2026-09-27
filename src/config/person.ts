// THE one shared identity-facts module. Home's JsonLdPerson is its only
// caller, and the module survives that single caller because the facts — not
// the markup — are the thing that must never be duplicated if a future
// section ever needs Person data.
// name/url/sameAs derive from the registry home entry + the canonical home URL; jobTitle is a
// typed constant (owner-supplied; never invented).
import { absoluteUrl } from './site';
import { getSections } from './sections';

// Deliberately a typed constant, not a content field: the registry schema
// stays minimal (slug/title/navLabel/order/template/description + URL links).
const JOB_TITLE: string = 'Software Engineer';

export interface PersonData {
  name: string;
  url: string;
  jobTitle: string;
  /** Present profile links only; empty when none are set. */
  sameAs: string[];
}

export async function getPersonData(): Promise<PersonData> {
  const sections = await getSections();
  const home = sections.find((s) => s.data.slug === 'home');
  if (!home) throw new Error('Registry missing "home" section — cannot derive Person facts.');
  return {
    name: home.data.title,
    url: absoluteUrl('/'), // canonical home URL, trailing slash included
    jobTitle: JOB_TITLE,
    sameAs: [home.data.github, home.data.linkedin].filter((u): u is string => Boolean(u)),
  };
}