import type { ReactNode } from 'react';

/**
 * Envoltura de sección. Concentra el ritmo vertical (80px mobile / 128px desktop,
 * DISENO.md §4), el ancho de contenido (1120px) y la relación aria. Si cada sección
 * los escribiera a mano, el ritmo se rompería en la tercera.
 *
 * **Sin numeración de eyebrow.** El "01".."08" era un recurso de página larga: servía
 * para ubicarse dentro de un scroll de ocho secciones. Con rutas propias, numerar dos
 * bloques de una página lee como un índice que no existe.
 *
 * `titleHidden` conserva el `<h2>` para el árbol de accesibilidad y lo saca de la vista.
 * Se usa cuando el título de la sección repite el `<h1>` de la página —"Proyectos"
 * debajo de "Proyectos"—: visualmente es ruido, pero borrar el encabezado dejaría a la
 * región sin nombre accesible y un lector de pantalla anunciaría "sección" a secas.
 */
export function Section({
  children,
  id,
  title,
  titleHidden = false,
}: {
  children: ReactNode;
  id: string;
  title: string;
  titleHidden?: boolean;
}) {
  const headingId = `${id}-title`;

  return (
    <section aria-labelledby={headingId} className="border-t border-line" id={id}>
      <div className="reveal mx-auto max-w-[1120px] px-6 py-16 md:px-10 md:py-24">
        <h2 className={titleHidden ? 'sr-only' : 'h2 mb-10'} id={headingId}>
          {title}
        </h2>
        {children}
      </div>
    </section>
  );
}
