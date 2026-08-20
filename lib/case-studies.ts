import caseStudiesEs from '@/content/case-studies.es.json';
import type { SupportedLocale } from '@/lib/i18n';
import type { CaseStudy } from '@/types/case-study';

const CASE_STUDIES = {
  es: caseStudiesEs as unknown as readonly CaseStudy[],
} as const satisfies Record<SupportedLocale, readonly CaseStudy[]>;

export function getCaseStudies(lang: SupportedLocale): readonly CaseStudy[] {
  return CASE_STUDIES[lang];
}

export function getCaseStudy(lang: SupportedLocale, slug: string): CaseStudy | undefined {
  return CASE_STUDIES[lang].find((study) => study.slug === slug);
}

/** Slugs con case study publicado. El hub enlaza solo estos. */
export function hasCaseStudy(lang: SupportedLocale, slug: string): boolean {
  return CASE_STUDIES[lang].some((study) => study.slug === slug);
}
