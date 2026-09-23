// Pure module: NO imports from 'astro:content' — imported by both content.config.ts
// (schema, runs in the content-layer context) and sections.ts (app context).
export const TEMPLATES = ['home', 'resume', 'about', 'projects', 'blog', 'now', 'uses'] as const;
export type Template = (typeof TEMPLATES)[number];

/** 'home' → 'HomeSection', 'resume' → 'ResumeSection', ... */
export function templateToComponentName(template: Template): string {
  return `${template.charAt(0).toUpperCase()}${template.slice(1)}Section`;
}