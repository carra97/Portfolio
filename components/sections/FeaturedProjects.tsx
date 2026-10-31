import Link from 'next/link';
import { ReplayOnView } from '@/components/ui/ReplayOnView';
import { getCaseStudies } from '@/lib/content/case-studies';
import type { SupportedLocale } from '@/lib/i18n';
import { routes } from '@/lib/routes';
import type { Profile } from '@/types/profile';

/**
 * Proyectos destacados en la landing, como fojas de un expediente.
 *
 * El criterio de "destacado" no es una bandera nueva en el JSON: **destacado es el que
 * tiene case study**. Un proyecto gana página propia cuando hay decisiones explicadas y
 * autocrítica para contar (lo exige el esquema), así que esa condición ya separa lo que
 * aguanta una lectura profunda de lo que es una línea de CV.
 *
 * **Cada foja muestra su máquina de estados** (Rev. 6). Antes eran tres tarjetas con
 * período, título, descripción y tags: el bloque de proyectos de cualquier portfolio. Lo
 * que estos tres tienen en común —y lo que ningún otro portfolio puede copiar— es que
 * cada uno es un recorrido de estados. El recorrido sale del case study (`flow`), así que
 * no hay una segunda copia que se pueda desincronizar. A la derecha, el sello con el
 * resultado.
 *
 * Es una lista ordenada y el número de foja sale del índice: el orden es el del JSON.
 * En un teléfono las fojas se apilan, sin carrusel: con el recorrido adentro, deslizar
 * de costado escondía justamente lo que distingue a cada una.
 */
export function FeaturedProjects({
  items,
  lang,
  ui,
}: {
  items: Profile['projects'];
  lang: SupportedLocale;
  ui: Profile['ui'];
}) {
  const featured = items.filter((project) => project.slug);
  const flows = new Map(getCaseStudies(lang).map((study) => [study.slug, study.flow]));

  return (
    <div>
      <ol className="grid gap-6">
        {featured.map((project, index) => {
          const flow = project.slug ? flows.get(project.slug) : undefined;

          return (
            <li
              key={project.name}
              className="grid overflow-hidden border border-line-strong bg-surface lg:grid-cols-[6.5rem_minmax(0,1fr)_14rem]"
            >
              <p className="label flex items-baseline gap-2 border-b border-line px-5 py-3 lg:block lg:border-b-0 lg:border-r lg:px-5 lg:py-6">
                {ui.folioLabel}
                <span className="block text-2xl font-medium leading-none text-heading lg:mt-1.5">
                  {String(index + 1).padStart(2, '0')}
                </span>
              </p>

              <div className="px-5 py-5 lg:px-8 lg:py-6">
                <p className="data">{project.period}</p>
                <h3 className="h3 mt-1.5 text-pretty">{project.name}</h3>
                {/* Recorte a tres líneas: la foja es un anzuelo, el caso está a un click.
                    El texto completo sigue en el DOM para el crawler y el lector de pantalla. */}
                <p className="measure mt-2 line-clamp-3 text-pretty">{project.description}</p>

                {flow && (
                  <>
                    <ol aria-label={flow.caption} className="mt-5 flex flex-wrap items-center gap-x-1.5 gap-y-2">
                      {flow.steps.map((step, stepIndex) => (
                        <li
                          key={step}
                          className="flex items-center gap-1.5 text-[0.8125rem] after:text-muted after:content-['→'] last:after:content-none"
                        >
                          <span
                            className={`rounded-md border px-2 py-0.5 font-mono ${
                              stepIndex === flow.steps.length - 1
                                ? 'border-accent text-heading'
                                : 'border-line-strong'
                            }`}
                          >
                            {step}
                          </span>
                        </li>
                      ))}
                    </ol>
                    <p className="small mt-2">
                      <span aria-hidden="true">↺ </span>
                      {flow.loop}
                    </p>
                  </>
                )}

                {project.slug && (
                  <p className="mt-5">
                    <Link className="prose-link" href={routes.caseStudy(lang, project.slug)}>
                      {ui.caseStudyLink}
                    </Link>
                  </p>
                )}
              </div>

              {project.stamp && (
                <div className="border-t border-line px-5 py-5 lg:flex lg:items-start lg:justify-center lg:border-l lg:border-t-0 lg:px-4 lg:py-7">
                  <ReplayOnView>
                    <p className="stamp stamp-drop">
                      <span>{project.stamp.label}</span>
                      <span>{project.stamp.note}</span>
                    </p>
                  </ReplayOnView>
                </div>
              )}
            </li>
          );
        })}
      </ol>

      <p className="mt-8">
        <Link className="prose-link" href={routes.projects(lang)}>
          {ui.viewProjects}
        </Link>
      </p>
    </div>
  );
}
