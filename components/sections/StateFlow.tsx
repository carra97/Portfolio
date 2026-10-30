import Link from 'next/link';
import type { CSSProperties } from 'react';

import type { SupportedLocale } from '@/lib/i18n';
import { routes } from '@/lib/routes';
import type { Flow } from '@/types/profile';

/**
 * Diagrama de estados del home: el momento firma del sitio.
 *
 * Lo que Santiago construye, en cada trabajo, es trabajo que avanza de un estado al
 * siguiente. En vez de decirlo en un bullet, se dibuja con un trámite real: los estados
 * y el desvío salen del contenido y los confirmó él (`hero.flow`).
 *
 * **Es una lista ordenada, no un SVG.** Un lector de pantalla lee los estados en orden y
 * después el desvío; el dibujo —la línea, los puntos, el corchete— es CSS sobre esa
 * lista. Sin JavaScript y sin librería de diagramas.
 *
 * Muestra el flujo de **un sistema**, nunca una línea de carrera: así no hay forma de que
 * se lea como "años de experiencia".
 *
 * `wide` lo dibuja de izquierda a derecha a todo el ancho desde 48rem: es la versión del
 * home, donde el recorrido es el protagonista. El case study usa la vertical.
 */
export function StateFlow({
  flow,
  lang,
  linkLabel,
  wide = false,
}: {
  flow: Flow & { slug?: string };
  lang: SupportedLocale;
  /** Con `flow.slug`, el link al case study. En el propio case study no va. */
  linkLabel?: string;
  wide?: boolean;
}) {
  const last = flow.steps.length - 1;
  const vars = {
    '--flow-cols': flow.steps.length,
    '--flow-from': flow.loopFrom ?? last - 1,
    '--flow-last': last,
  };

  return (
    <figure className={wide ? 'flow flow-wide' : 'flow'} style={vars as CSSProperties}>
      <figcaption className="label">{flow.caption}</figcaption>

      <div className={wide ? 'relative mt-6 w-fit md:w-full' : 'relative mt-5 w-fit'}>
        <ol className="flow-list data text-[0.9375rem]">
          {flow.steps.map((step, index) => (
            <li
              key={step}
              className={index === last ? 'flow-step flow-step-final' : 'flow-step'}
              style={{ '--step': index } as CSSProperties}
            >
              {step}
            </li>
          ))}
        </ol>

        {/* El desvío va después de la lista en el árbol de accesibilidad: se lee como
            una nota sobre el recorrido, que es lo que es. */}
        <span aria-hidden="true" className="flow-loop" />
        <p className="flow-loop-label data">{flow.loop}</p>
      </div>

      {flow.slug && linkLabel && (
        <p className="mt-6">
          <Link className="prose-link text-sm" href={routes.caseStudy(lang, flow.slug)}>
            {linkLabel}
          </Link>
        </p>
      )}
    </figure>
  );
}
