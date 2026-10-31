import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import Link from 'next/link';
import { Footer } from '@/components/layout/Footer';
import { Nav } from '@/components/layout/Nav';
import { ProjectEvidence } from '@/components/sections/ProjectEvidence';
import { StateFlow } from '@/components/sections/StateFlow';
import { getCaseStudies, getCaseStudy } from '@/lib/content/case-studies';
import { getProfile } from '@/lib/content/profile';
import { env } from '@/lib/env';
import { LOCALES, isSupportedLocale, otherLocale } from '@/lib/i18n';
import { buildNav } from '@/lib/pages/nav';
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
    alternates: {
      canonical: routes.caseStudy(lang, slug),
      languages: Object.fromEntries(
        LOCALES.map((locale) => [locale, routes.caseStudy(locale, slug)]),
      ),
    },
    openGraph: {
      type: 'article',
      title: study.title,
      description: study.summary,
      url: routes.caseStudy(lang, slug),
    },
  };
}

/**
 * Un bloque del case study como fila de expediente: el título al margen, el contenido en
 * la columna de lectura. El `<h2>` sigue siendo un encabezado real —el árbol de
 * documento no cambia—; solo cambia dónde se dibuja.
 */
function Block({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <section className="doc-row border-t border-line py-12">
      <h2 className="h3 text-heading">{title}</h2>
      <div className="max-w-[68ch]">{children}</div>
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
  const project = profile.projects.find((item) => item.slug === slug);
  const labels = profile.caseStudyLabels;

  return (
    <>
      {/* El nav global también acá: un case study es la página más profunda y la que más
          se comparte. Sin él, quien llega por un link directo no tiene adónde seguir. El
          case study cuelga de Proyectos, así que esa pestaña queda marcada. */}
      <Nav
        label={profile.ui.navLabel}
        lang={lang}
        navigation={buildNav('projects', lang, profile, routes.caseStudy(otherLocale(lang), slug))}
        themeLabel={profile.ui.themeToggle}
      />

      <main className="page" id="content">
        <div className="doc-row pb-12 pt-8 md:pt-16">
          {/* Al margen, la miga de pan: de qué expediente cuelga este. */}
          <nav aria-label={profile.ui.breadcrumbLabel} className="md:pt-2">
            <Link className="prose-link text-sm" href={routes.projects(lang)}>
              ← {profile.sections.projects}
            </Link>
          </nav>

          <header className="max-w-[68ch]">
            <h1 className="display-sm">{study.title}</h1>
            <p className="mt-6 text-pretty text-heading">{study.summary}</p>
            {/* Es un párrafo, no una etiqueta: en mayúsculas mono de 12px se leía lento
                y era lo primero que encontraba quien entraba al case study. */}
            <p className="small measure mt-4 text-pretty">{study.context}</p>
            <ul className="mt-8 flex flex-wrap gap-2">
              {study.tech.map((tech) => (
                <li key={tech} className="tag">
                  {tech}
                </li>
              ))}
            </ul>

            {/* El momento de movimiento de la página: el recorrido del sistema. */}
            {study.flow && (
              <div className="mt-12">
                <StateFlow flow={study.flow} lang={lang} />
              </div>
            )}
          </header>
        </div>

        <div>
          {/* La prueba antes que el relato: la foto y la nota van arriba de las métricas. */}
          {project && (project.image || project.press) && (
            <div className="doc-offset max-w-[calc(68ch+15.5rem)] pb-12">
              <ProjectEvidence project={project} ui={profile.ui} />
            </div>
          )}

          {study.metrics && (
            <dl className="doc-offset grid gap-6 border-t border-line py-10 sm:grid-cols-3">
              {study.metrics.map((metric) => (
                <div key={metric.label}>
                  <dt className="label">{metric.label}</dt>
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
              {/* Sin numeración: las decisiones no son pasos de una secuencia. */}
              {study.decisions.map((decision) => (
                <li key={decision.title}>
                  <h3 className="h3">{decision.title}</h3>
                  <p className="mt-3 text-pretty">{decision.rationale}</p>
                  <p className="mt-3 border-l-2 border-accent-dim pl-4 text-pretty text-muted">
                    <span className="font-medium text-heading">{labels.tradeoff}: </span>
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
                  <span aria-hidden="true" className="mt-3.5 h-px w-4 shrink-0 bg-accent-dim" />
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

          <div className="doc-offset border-t border-line py-12">
            <Link className="btn-primary" href={routes.contact(lang)}>
              {profile.ui.caseStudyContactCta}
            </Link>
          </div>
        </div>
      </main>

      <Footer lang={lang} profile={profile} />
    </>
  );
}
