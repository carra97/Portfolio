import type { Profile } from '@/types/profile';

/**
 * La evidencia de un proyecto: la foto y la nota de prensa.
 *
 * Vive en `/projects` y en el case study. Es lo único del sitio que una plantilla no
 * puede copiar, y antes solo aparecía en el hub: quien llegaba al case study desde el
 * diagrama del home leía el caso entero sin ver la prueba.
 *
 * La nota vive dentro de su proyecto (DISENO.md §7.4). Se cita solo la frase que refiere a
 * Santiago; nunca funcionarios ni declaraciones de terceros.
 */
export function ProjectEvidence({
  project,
  ui,
}: {
  project: Profile['projects'][number];
  ui: Profile['ui'];
}) {
  return (
    <>
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
    </>
  );
}
