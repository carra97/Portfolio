import type { SupportedLocale } from '@/lib/i18n';
import { getNavPages, pageHref, type PageId } from '@/lib/pages/registry';
import type { Profile } from '@/types/profile';

export interface NavEntry {
  /** Página actual: se marca con `aria-current="page"`, no solo con color. */
  readonly current: boolean;
  readonly href: string;
  readonly label: string;
}

export interface Navigation {
  /** La acción principal, anclada fuera de la lista deslizable. */
  readonly cta: NavEntry | null;
  /** Destinos de lectura, en orden. */
  readonly destinations: readonly NavEntry[];
}

/**
 * Navegación principal, derivada del registro de páginas.
 *
 * Antes era un array en el JSON con ocho anclas escritas a mano. Dos consecuencias que
 * desaparecen: ya no puede quedar un link apuntando a una sección que se movió, y el
 * nav no depende de en qué página estás — son URLs absolutas, no fragmentos.
 */
export function buildNav(current: PageId, lang: SupportedLocale, profile: Profile): Navigation {
  const entry = (id: PageId): NavEntry => ({
    current: id === current,
    href: pageHref(id, lang),
    label: profile.pages[id].navLabel,
  });

  const pages = getNavPages();

  return {
    cta: pages.filter((page) => page.navCta).map((page) => entry(page.id))[0] ?? null,
    destinations: pages.filter((page) => !page.navCta).map((page) => entry(page.id)),
  };
}
