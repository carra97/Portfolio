import profileEs from '@/content/profile.es.json';
import { createContentLoader } from '@/lib/content/loader';
import { profileSchema, type Profile } from '@/lib/content/schema';
import type { SupportedLocale } from '@/lib/i18n';

const profiles = createContentLoader('profile', profileSchema, {
  es: profileEs,
} satisfies Record<SupportedLocale, unknown>);

export function getProfile(lang: SupportedLocale): Profile {
  return profiles.get(lang);
}
