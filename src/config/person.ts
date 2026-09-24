// THE one shared identity-facts module (design §8.2). Home JsonLdPerson (T-13)
// and Résumé JsonLdProfilePage (T-14) BOTH call getPersonData() — no duplicated
// facts anywhere. name/url/sameAs derive from the registry home entry + SITE_URL;
// jobTitle is a marked HUMAN COPY constant (replaced at T-23; never invented).
import { SITE_URL } from './site';
import { getSections } from './sections';

// HUMAN COPY — job title. Deliberately a typed constant, not a content field:
// the registry schema stays minimal (slug/title/navLabel/order/template/description
// + URL links). Replace with the owner's real job title at T-23.
const JOB_TITLE: string = 'HUMAN COPY — job title';

export interface PersonData {
  name: string;
  url: string;
  jobTitle: string;
  sameAs: [string, string];
}

export async function getPersonData(): Promise<PersonData> {
  const sections = await getSections();
  const home = sections.find((s) => s.data.slug === 'home');
  if (!home) throw new Error('Registry missing "home" section — cannot derive Person facts.');
  return {
    name: home.data.title,
    url: SITE_URL,
    jobTitle: JOB_TITLE,
    sameAs: [home.data.github ?? '', home.data.linkedin ?? ''],
  };
}