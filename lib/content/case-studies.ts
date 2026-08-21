import caseStudiesEs from '@/content/case-studies.es.json';
import { createContentLoader } from '@/lib/content/loader';
import { caseStudiesSchema, type CaseStudy } from '@/lib/content/schema';
import type { SupportedLocale } from '@/lib/i18n';

const caseStudies = createContentLoader('case-studies', caseStudiesSchema, {
  es: caseStudiesEs,
} satisfies Record<SupportedLocale, unknown>);

export function getCaseStudies(lang: SupportedLocale): readonly CaseStudy[] {
  return caseStudies.get(lang);
}

export function getCaseStudy(lang: SupportedLocale, slug: string): CaseStudy | undefined {
  return caseStudies.get(lang).find((study) => study.slug === slug);
}

/** Slugs con case study publicado. El hub enlaza solo estos. */
export function hasCaseStudy(lang: SupportedLocale, slug: string): boolean {
  return caseStudies.get(lang).some((study) => study.slug === slug);
}
