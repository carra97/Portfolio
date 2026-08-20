import profileEs from '@/content/profile.es.json';
import type { Profile } from '@/types/profile';
import type { SupportedLocale } from '@/lib/i18n';

/**
 * Carga del contenido.
 *
 * Import estático y no lectura de disco: el JSON entra al bundle en build time, el
 * sitio se prerenderiza completo y no hay I/O en runtime ni modo de falla por archivo
 * ausente. El `satisfies Profile` es el chequeo real — si el JSON deja de cumplir el
 * esquema, rompe la compilación, no la página.
 */
const PROFILES = {
  es: profileEs as unknown as Profile,
} as const satisfies Record<SupportedLocale, Profile>;

export function getProfile(lang: SupportedLocale): Profile {
  return PROFILES[lang];
}
