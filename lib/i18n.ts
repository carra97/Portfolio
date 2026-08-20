import type { Lang } from '@/types/profile';

/**
 * Idiomas que el sitio genera estáticamente.
 *
 * Decisión: se arranca solo con 'es'. El plan es bilingüe, pero publicar un `/en`
 * con contenido traducido a medias es peor que no tenerlo — y el segmento `[lang]`
 * ya está en el routing, así que sumar 'en' es agregar un JSON y un elemento a este
 * array. El costo de posponerlo es cero; el de publicarlo incompleto, no.
 */
export const LOCALES = ['es'] as const satisfies readonly Lang[];

export const DEFAULT_LOCALE: Lang = 'es';

export type SupportedLocale = (typeof LOCALES)[number];

export function isSupportedLocale(value: string): value is SupportedLocale {
  return (LOCALES as readonly string[]).includes(value);
}
