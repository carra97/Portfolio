import Link from 'next/link';
import { ProjectEvidence } from '@/components/sections/ProjectEvidence';
import type { SupportedLocale } from '@/lib/i18n';
import { routes } from '@/lib/routes';
import type { Profile } from '@/types/profile';

/**
 * Case studies, no tarjetas.
 *
 * Dos reglas del proyecto se hacen cumplir acá:
 * - `status: 'archived'` ⇒ el proyecto NO se enlaza. Está en el esquema, no en la memoria.
 * - La nota de prensa vive DENTRO de su proyecto (DISENO.md §7.4): una sola nota no
 *   justifica una sección propia, y aislada parece que se estira el material
 *   (`ProjectEvidence`).
 *
 * Recibe `ui` entero en vez de cinco props de string sueltas. Con dos labels la lista
 * explícita documenta la dependencia; con cinco, solo agrega ruido en el registro.
 */
export function Projects({
  items,
  lang,
  ui,
}: {
  items: Profile['projects'];
  lang: SupportedLocale;
  ui: Profile['ui'];
}) {
  return (
    <ul className="space-y-20">
      {items.map((project) => {
        const linkable = project.status !== 'archived' && Boolean(project.url);

        return (
          <li key={project.name} className="doc-row">
            {/* Al margen: cuándo y en qué estado está la evidencia. */}
            <div className="space-y-1 md:pt-1">
              <p className="data">{project.period}</p>
              {project.status === 'verifiable' && (
                <p className="badge">{ui.verifiableBadge}</p>
              )}
            </div>

            <div>
              <h3 className="h3">
                {linkable ? (
                  <a
                    className="prose-link"
                    href={project.url}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {project.name}
                  </a>
                ) : (
                  project.name
                )}
              </h3>

              <p className="measure mt-4 text-pretty">{project.description}</p>
              {project.result && (
                <p className="measure mt-3 text-pretty text-heading">{project.result}</p>
              )}
              {project.status === 'archived' && <p className="small mt-3">{ui.projectArchived}</p>}
              {project.status === 'internal' && <p className="small mt-3">{ui.projectInternal}</p>}

              <ProjectEvidence project={project} ui={ui} />

              {project.slug && (
                <p className="mt-6">
                  <Link className="prose-link" href={routes.caseStudy(lang, project.slug)}>
                    {ui.caseStudyLink}
                  </Link>
                </p>
              )}

              <ul className="mt-7 flex flex-wrap gap-2">
                {project.tech.map((tech) => (
                  <li
                    key={tech}
                    className="tag"
                  >
                    {tech}
                  </li>
                ))}
              </ul>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
