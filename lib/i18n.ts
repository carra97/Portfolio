import type { Lang } from '@/types/profile';

/**
 * Idiomas que el sitio genera estáticamente.
 *
 * 'en' entró con paridad completa: las mismas claves y los mismos hechos que 'es'
 * (el esquema obliga lo primero; `content:check` y las evals, lo segundo). Publicar
 * un `/en` traducido a medias seguiría siendo peor que no tenerlo.
 */
export const LOCALES = ['es', 'en'] as const satisfies readonly Lang[];

export const DEFAULT_LOCALE: Lang = 'es';

export type SupportedLocale = (typeof LOCALES)[number];

/** Cada idioma con su nombre en ese idioma: el selector ofrece "English", no "Inglés". */
export const LOCALE_NAMES: Readonly<Record<SupportedLocale, string>> = {
  en: 'English',
  es: 'Español',
};

/**
 * El otro idioma, para el selector.
 *
 * ponytail: con dos idiomas alcanza un toggle; con un tercero, el selector pasa a ser
 * una lista y esto deja de existir.
 */
export function otherLocale(lang: SupportedLocale): SupportedLocale {
  return lang === 'es' ? 'en' : 'es';
}

export function isSupportedLocale(value: string): value is SupportedLocale {
  return (LOCALES as readonly string[]).includes(value);
}
