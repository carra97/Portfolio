import type { Profile } from '@/types/profile';

/**
 * "Sobre mí" a dos columnas: relato a la izquierda, retrato enmarcado a la derecha.
 *
 * DISENO.md §7.1 — el retrato es blanco y negro por decisión de Santi, y es una
 * excepción explícita al tratamiento cálido del resto. Para que no lea como una foto
 * fría suelta, el marco compensa: card `--bg-surface`, hairline, esquinas de 12px y el
 * nombre en la tipografía cálida al lado. Cuadrada, no círculo, y nunca como avatar
 * chico: a 40px la cara desaparece.
 */
export function About({
  about,
  caption,
  timelineTitle,
}: {
  about: Profile['about'];
  caption: string;
  timelineTitle: string;
}) {
  return (
    <>
      <div className="grid gap-12 md:grid-cols-[1fr_280px] md:gap-16">
        <div className="measure space-y-6">
          {about.narrative.map((paragraph) => (
            <p key={paragraph.slice(0, 40)} className="text-pretty">
              {paragraph}
            </p>
          ))}

          <figure className="border-l-2 border-accent pl-5">
            <blockquote className="text-pretty text-heading">{about.principle}</blockquote>
          </figure>

          <ul className="space-y-2">
            {about.principleSupport.map((item) => (
              <li key={item.slice(0, 30)} className="flex gap-3 text-pretty">
                <span aria-hidden="true" className="mt-3 h-px w-4 shrink-0 bg-accent-dim" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <figure className="order-first rounded-xl border border-line bg-surface p-3 md:order-none md:self-start">
          <img
            alt="Retrato en blanco y negro de Santiago Carrattini"
            className="w-full rounded-lg"
            height={400}
            src="/santiago-carrattini.jpg"
            width={400}
          />
          <figcaption className="mt-3 px-1 pb-1 font-mono text-xs tracking-[0.12em] text-muted">
            {caption}
          </figcaption>
        </figure>
      </div>

      <div className="mt-20">
        <h3 className="h3 mb-8">{timelineTitle}</h3>
        <ol className="relative border-l border-line pl-8">
          {about.timeline.map((milestone, index) => (
            <li key={milestone.title} className="relative pb-10 last:pb-0">
              {/* El hito activo —el último, "Hoy"— en acento; los demás, apagados. */}
              <span
                aria-hidden="true"
                className={`absolute -left-[calc(2rem+4px)] top-2.5 h-2 w-2 rounded-full ${
                  index === about.timeline.length - 1 ? 'bg-accent' : 'bg-line-strong'
                }`}
              />
              <p className="font-mono text-xs uppercase tracking-[0.12em] text-muted">
                {milestone.at}
              </p>
              <h4 className="mt-1 text-heading">{milestone.title}</h4>
              <p className="measure mt-2 text-pretty">{milestone.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </>
  );
}
