import type { ReactNode } from 'react';

/**
 * Envoltura de sección. Concentra el ritmo vertical (80px mobile / 128px desktop,
 * DISENO.md §4), el ancho de contenido (1120px) y la relación aria. Si cada sección
 * los escribiera a mano, el ritmo se rompería en la tercera.
 */
export function Section({
  children,
  eyebrow,
  id,
  title,
}: {
  children: ReactNode;
  eyebrow?: string;
  id: string;
  title: string;
}) {
  const headingId = `${id}-title`;

  return (
    <section aria-labelledby={headingId} className="border-t border-line" id={id}>
      <div className="reveal mx-auto max-w-[1120px] px-6 py-20 md:px-10 md:py-32">
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h2 className="h2 mb-12" id={headingId}>
          {title}
        </h2>
        {children}
      </div>
    </section>
  );
}
