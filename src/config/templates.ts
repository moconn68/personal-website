// Pure module: NO imports from 'astro:content' — imported by both content.config.ts
// (schema, runs in the content-layer context) and sections.ts (app context).
//
// Must list ONLY templates that have a component at
// src/templates/<templateToComponentName(t)>.astro. Content using an
// unimplemented template would otherwise pass schema validation and only fail
// later during route dispatch. When adding a template component, add its
// name here too.
export const TEMPLATES = ['home', 'about'] as const;
export type Template = (typeof TEMPLATES)[number];

/** 'home' → 'HomeSection', 'about' → 'AboutSection', ... */
export function templateToComponentName(template: Template): string {
  return `${template.charAt(0).toUpperCase()}${template.slice(1)}Section`;
}
