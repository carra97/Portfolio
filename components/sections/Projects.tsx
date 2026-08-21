import type { SupportedLocale } from '@/lib/i18n';
import { routes } from '@/lib/routes';
import type { Profile } from '@/types/profile';

/**
 * Case studies, no tarjetas.
 *
 * Dos reglas del proyecto se hacen cumplir acá:
 * - `status: 'archived'` ⇒ el proyecto NO se enlaza. Está en el esquema, no en la memoria.
 * - La nota de prensa vive DENTRO de su proyecto (DISENO.md §7.4): una sola nota no
 *   justifica una sección propia, y aislada parece que se estira el material. Se cita
 *   solo la frase que refiere a Santiago; nunca funcionarios ni declaraciones de terceros.
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
          <li key={project.name}>
            <p className="font-mono text-xs uppercase tracking-[0.12em] text-muted">
              {project.period}
            </p>

            <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
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
              {project.status === 'verifiable' && (
                <span className="rounded-md bg-accent-bg px-2 py-0.5 font-mono text-xs uppercase tracking-[0.12em] text-accent">
                  {ui.verifiableBadge}
                </span>
              )}
            </div>

            <p className="measure mt-4 text-pretty">{project.description}</p>
            {project.result && (
              <p className="measure mt-3 text-pretty text-heading">{project.result}</p>
            )}
            {project.status === 'archived' && <p className="small mt-3">{ui.projectArchived}</p>}
            {project.status === 'internal' && <p className="small mt-3">{ui.projectInternal}</p>}

            {project.image && (
              <figure className="mt-8">
                <img
                  alt={project.image.alt}
                  className="w-full rounded-xl border border-line"
                  decoding="async"
                  height={520}
                  loading="lazy"
                  src={project.image.src}
                  width={800}
                />
                <figcaption className="small mt-3">{project.image.caption}</figcaption>
              </figure>
            )}

            {project.press && (
              <div className="mt-8 rounded-xl border border-line bg-surface p-6">
                <p className="eyebrow">{ui.pressEyebrow}</p>
                <p className="measure mt-3 text-pretty">
                  {ui.pressIntro} <em className="text-heading">“{project.press.quote}”</em>.
                </p>
                <a
                  className="prose-link mt-3 inline-block text-pretty"
                  href={project.press.url}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {project.press.title}
                </a>
                <p className="small mt-2">
                  {project.press.outlet} · {project.press.date}
                </p>
              </div>
            )}

            {project.slug && (
              <p className="mt-6">
                <a className="prose-link" href={routes.caseStudy(lang, project.slug)}>
                  {ui.caseStudyLink} →
                </a>
              </p>
            )}

            <ul className="mt-7 flex flex-wrap gap-2">
              {project.tech.map((tech) => (
                <li
                  key={tech}
                  className="rounded-md border border-line px-2.5 py-1 font-mono text-xs text-muted"
                >
                  {tech}
                </li>
              ))}
            </ul>
          </li>
        );
      })}
    </ul>
  );
}
