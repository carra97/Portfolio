import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { Footer } from '@/components/layout/Footer';
import { getCaseStudies, getCaseStudy } from '@/lib/content/case-studies';
import { getProfile } from '@/lib/content/profile';
import { env } from '@/lib/env';
import { LOCALES, isSupportedLocale } from '@/lib/i18n';
import { routes } from '@/lib/routes';

/**
 * Página de case study.
 *
 * Existe porque un proyecto serio no entra en un párrafo, y porque el hub tiene que
 * seguir leyéndose de una pasada: quien escanea en 40 segundos no debería pagar el
 * costo de la profundidad, y quien se enganchó no debería quedarse sin ella.
 *
 * Estático: una ruta por (idioma, slug), prerenderizada en build.
 */

export function generateStaticParams() {
  return LOCALES.flatMap((lang) =>
    getCaseStudies(lang).map((study) => ({ lang, slug: study.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isSupportedLocale(lang)) return {};

  const study = getCaseStudy(lang, slug);
  if (!study) return {};

  return {
    title: `${study.title} — Santiago Carrattini`,
    description: study.summary,
    metadataBase: new URL(env.SITE_URL),
    alternates: { canonical: routes.caseStudy(lang, slug) },
    openGraph: {
      type: 'article',
      title: study.title,
      description: study.summary,
      url: routes.caseStudy(lang, slug),
    },
  };
}

function Block({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <section className="border-t border-line py-12">
      <h2 className="eyebrow mb-6">{title}</h2>
      {children}
    </section>
  );
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  if (!isSupportedLocale(lang)) notFound();

  const study = getCaseStudy(lang, slug);
  if (!study) notFound();

  const profile = getProfile(lang);
  const labels = profile.caseStudyLabels;

  return (
    <>
      <div className="mx-auto max-w-[1120px] px-6 md:px-10">
        <div className="max-w-[68ch]">
          <nav aria-label={profile.ui.breadcrumbLabel} className="py-8">
            <a
              className="prose-link font-mono text-xs uppercase tracking-[0.12em]"
              href={routes.projects(lang)}
            >
              ← {profile.sections.projects}
            </a>
          </nav>

          <header className="pb-12">
            <p className="eyebrow">{study.context}</p>
            <h1 className="display mt-6 !text-[clamp(2rem,4.5vw,2.75rem)]">{study.title}</h1>
            <p className="mt-6 text-pretty text-heading">{study.summary}</p>
            <ul className="mt-8 flex flex-wrap gap-2">
              {study.tech.map((tech) => (
                <li
                  key={tech}
                  className="rounded-md border border-line px-2.5 py-1 font-mono text-xs text-muted"
                >
                  {tech}
                </li>
              ))}
            </ul>
          </header>

          {study.metrics && (
            <dl className="grid gap-6 border-t border-line py-10 sm:grid-cols-3">
              {study.metrics.map((metric) => (
                <div key={metric.label}>
                  <dt className="eyebrow">{metric.label}</dt>
                  <dd className="mt-2 text-2xl text-heading">{metric.value}</dd>
                  {metric.note && <p className="small mt-1">{metric.note}</p>}
                </div>
              ))}
            </dl>
          )}

          <Block title={labels.problem}>
            <div className="space-y-4">
              {study.problem.map((p) => (
                <p key={p.slice(0, 40)} className="text-pretty">
                  {p}
                </p>
              ))}
            </div>
          </Block>

          <Block title={labels.constraints}>
            <ul className="space-y-3">
              {study.constraints.map((c) => (
                <li key={c.slice(0, 40)} className="flex gap-4 text-pretty">
                  <span aria-hidden="true" className="mt-3.5 h-px w-4 shrink-0 bg-accent-dim" />
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </Block>

          {/* El corazón del case study: qué se eligió, por qué, y contra qué.
              Sin el trade-off explícito esto sería una lista de tecnologías. */}
          <Block title={labels.decisions}>
            <ol className="space-y-10">
              {study.decisions.map((decision, index) => (
                <li key={decision.title}>
                  <p className="font-mono text-xs text-muted">
                    {String(index + 1).padStart(2, '0')}
                  </p>
                  <h3 className="h3 mt-1">{decision.title}</h3>
                  <p className="mt-3 text-pretty">{decision.rationale}</p>
                  <p className="mt-3 border-l-2 border-accent-dim pl-4 text-pretty text-muted">
                    <span className="font-mono text-xs uppercase tracking-[0.12em] text-accent">
                      {labels.tradeoff}:{' '}
                    </span>
                    {decision.tradeoff}
                  </p>
                </li>
              ))}
            </ol>
          </Block>

          <Block title={labels.architecture}>
            <p className="text-pretty">{study.architecture}</p>
          </Block>

          <Block title={labels.outcome}>
            <ul className="space-y-3">
              {study.outcome.map((o) => (
                <li key={o.slice(0, 40)} className="flex gap-4 text-pretty">
                  <span aria-hidden="true" className="mt-3.5 h-px w-4 shrink-0 bg-accent" />
                  <span>{o}</span>
                </li>
              ))}
            </ul>
          </Block>

          <Block title={labels.retrospective}>
            <ul className="space-y-4">
              {study.retrospective.map((r) => (
                <li key={r.slice(0, 40)} className="text-pretty">
                  {r}
                </li>
              ))}
            </ul>
          </Block>

          <div className="border-t border-line py-12">
            <a
              className="rounded-md bg-accent px-5 py-2.5 font-medium text-accent-on transition-colors duration-150 hover:bg-accent-hover"
              href={routes.contact(lang)}
            >
              {profile.ui.caseStudyContactCta}
            </a>
          </div>
        </div>
      </div>

      <Footer lang={lang} name={profile.hero.name} ui={profile.ui} />
    </>
  );
}
