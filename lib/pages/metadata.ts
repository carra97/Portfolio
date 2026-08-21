import type { Metadata } from 'next';

import { getProfile } from '@/lib/content/profile';
import { LOCALES, isSupportedLocale } from '@/lib/i18n';
import { pageHref, type PageId } from '@/lib/pages/registry';

/**
 * Metadata de una página, derivada del registro.
 *
 * Cinco rutas × (title, description, canonical, hreflang, OpenGraph) son veinticinco
 * campos que, escritos a mano, se copian entre archivos. El error típico de ese copiado
 * es un `canonical` que quedó apuntando a la página anterior: no rompe nada visible y
 * hace que Google trate dos páginas como la misma.
 */
export function buildPageMetadata(page: PageId, lang: string): Metadata {
  if (!isSupportedLocale(lang)) return {};

  const { pages } = getProfile(lang);
  const meta = pages[page];
  const path = pageHref(page, lang);

  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: path,
      languages: Object.fromEntries(LOCALES.map((locale) => [locale, pageHref(page, locale)])),
    },
    openGraph: {
      type: 'profile',
      locale: lang,
      title: meta.title,
      description: meta.description,
      url: path,
    },
  };
}
