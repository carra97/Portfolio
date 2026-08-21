import type { SupportedLocale } from '@/lib/i18n';
import { getPages, pageHref, type PageId } from '@/lib/pages/registry';

/**
 * Constructores de URL.
 *
 * Las rutas de página salen del registro (`lib/pages/registry.ts`); acá viven los
 * atajos con nombre y las rutas que no son páginas del registro porque son dinámicas
 * —los case studies—. Ningún componente arma un `href` concatenando strings: si mañana
 * `about-me` pasa a `sobre-mi`, se toca una línea del registro y una carpeta.
 */

export const routes = {
  about: (lang: SupportedLocale) => pageHref('about', lang),
  /**
   * Case study de un proyecto. Vive bajo la página de proyectos, así que su prefijo se
   * deriva de ella en vez de repetir el segmento.
   */
  caseStudy: (lang: SupportedLocale, slug: string) =>
    `${pageHref('projects', lang)}/${encodeURIComponent(slug)}`,
  contact: (lang: SupportedLocale) => pageHref('contact', lang),
  education: (lang: SupportedLocale) => pageHref('education', lang),
  experience: (lang: SupportedLocale) => pageHref('experience', lang),
  hobbies: (lang: SupportedLocale) => pageHref('hobbies', lang),
  home: (lang: SupportedLocale) => pageHref('home', lang),
  projects: (lang: SupportedLocale) => pageHref('projects', lang),
} as const;

/** Todas las rutas estáticas de un idioma. Lo usa el sitemap. */
export function staticRoutes(lang: SupportedLocale): readonly { id: PageId; url: string }[] {
  return getPages().map((page) => ({ id: page.id, url: pageHref(page.id, lang) }));
}
