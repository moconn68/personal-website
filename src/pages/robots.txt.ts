// Prerendered robots.txt endpoint. Global allow-all plus named Allow blocks for
// the AI-assistant crawlers that matter — blanket disallows silently block AI
// visibility; named bots are allowed explicitly. ZERO Disallow rules anywhere
// (pages stay crawlable). Sitemap line reads SITE_URL and targets
// @astrojs/sitemap's exact index filename (`sitemap-index.xml`) — byte-identical
// with the built file.
import type { APIRoute } from 'astro';
import { SITE_URL } from '../config/site';

export const prerender = true;

const AI_BOTS = ['OAI-SearchBot', 'ChatGPT-User', 'PerplexityBot', 'ClaudeBot'] as const;

export const GET: APIRoute = () => {
  const lines: string[] = [];
  for (const bot of ['*', ...AI_BOTS]) {
    lines.push(`User-agent: ${bot}`, 'Allow: /', '');
  }
  lines.push(`Sitemap: ${SITE_URL}/sitemap-index.xml`);
  return new Response(lines.join('\n') + '\n', {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};