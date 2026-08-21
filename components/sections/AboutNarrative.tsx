import type { Profile } from '@/types/profile';

/**
 * Relato personal. Vive en `/[lang]/about-me`, no en el hub.
 *
 * El retrato es blanco y negro por decisión de Santi (DISENO.md §7.1) y es una excepción
 * explícita al tratamiento cálido del resto. Para que no lea como una foto fría suelta,
 * el marco compensa: card `--bg-surface`, hairline y esquinas de 12px. Cuadrada, no
 * círculo, y nunca como avatar chico: a 40px la cara desaparece.
 */
export function AboutNarrative({
  about,
  caption,
  photoAlt,
}: {
  about: Profile['about'];
  caption: string;
  photoAlt: string;
}) {
  return (
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
          alt={photoAlt}
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
  );
}
