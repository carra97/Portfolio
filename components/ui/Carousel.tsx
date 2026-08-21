'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

import { interpolate } from '@/lib/format';

/**
 * Carrusel accesible sobre scroll-snap nativo.
 *
 * **La decisión de fondo: el carrusel no renderiza el contenido.** Los ítems llegan
 * como `children` ya renderizados en el servidor y este componente solo los envuelve.
 * Consecuencias, que son el motivo:
 *
 * - Los ítems están completos en el HTML inicial. Google los indexa y un lector de
 *   pantalla los lee todos, en orden, sin tocar ningún control. Un carrusel que monta y
 *   desmonta slides esconde el contenido del crawler y del modo lectura.
 * - Sin JavaScript sigue siendo funcional: `overflow-x` + `scroll-snap` son CSS, el
 *   swipe táctil es nativo del navegador y el `tabindex` hace que las flechas del
 *   teclado desplacen la región. Los controles son una mejora encima, no el mecanismo.
 *
 * Alternativa descartada: Embla o Swiper. 10-35 KB de JS y una dependencia nueva para
 * mover tres tarjetas — el proyecto es explícito en no sumar librerías "por las dudas".
 * Lo que dan de más (loop, autoplay, drag con inercia) es justamente lo que no
 * queremos: nada acá se mueve solo.
 *
 * En ≥ md el carrusel desaparece: se vuelve grilla y todo se ve a la vez. El carrusel
 * resuelve un problema de ancho, y en desktop no existe.
 */

export interface CarouselLabels {
  /** Nombre accesible de la región. */
  readonly group: string;
  readonly next: string;
  readonly previous: string;
  /** `aria-roledescription` de la región. */
  readonly role: string;
  /** Plantilla con {n} y {total} para el label de cada punto. */
  readonly slidePosition: string;
}

/**
 * Las clases de grilla se eligen de un mapa de literales completos y no se arman por
 * interpolación: Tailwind escanea el código fuente en busca de strings de clase, y una
 * clase construida en runtime (`md:grid-cols-${n}`) no existe en el CSS generado.
 */
const COLUMNS = {
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-3',
} as const;

export function Carousel({
  children,
  columns = 3,
  itemCount,
  labels,
}: {
  children: ReactNode;
  /** Columnas de la grilla en ≥ md, donde el carrusel deja de existir. */
  columns?: keyof typeof COLUMNS;
  itemCount: number;
  labels: CarouselLabels;
}) {
  const scrollerRef = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);

  /**
   * El índice activo se deriva de la posición real del scroll, no de un estado que
   * el componente cree tener. Es la única forma de que el swipe táctil —que no pasa
   * por ningún handler nuestro— mantenga los puntos sincronizados.
   */
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const items = Array.from(scroller.children);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const index = items.indexOf(visible.target);
        if (index >= 0) setActive(index);
      },
      { root: scroller, threshold: 0.6 },
    );

    for (const item of items) observer.observe(item);
    return () => observer.disconnect();
  }, [itemCount]);

  const goTo = useCallback((index: number) => {
    const scroller = scrollerRef.current;
    const target = scroller?.children.item(index);
    if (!scroller || !target) return;

    // Delta por `getBoundingClientRect` y no por `offsetLeft`: `offsetLeft` es relativo
    // al offsetParent, que depende del `position` de los ancestros. Esto no.
    const delta = target.getBoundingClientRect().left - scroller.getBoundingClientRect().left;

    scroller.scrollBy({
      left: delta,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'auto'
        : 'smooth',
    });
  }, []);

  const atStart = active === 0;
  const atEnd = active === itemCount - 1;

  return (
    <div aria-label={labels.group} aria-roledescription={labels.role} role="group">
      <ul
        ref={scrollerRef}
        // `tabIndex` en una región desplazable: sin esto, quien navega con teclado no
        // puede llegar al contenido que está fuera de vista. Con esto, las flechas la
        // desplazan de forma nativa.
        className={`carousel-scroller -mx-6 flex snap-x snap-mandatory items-stretch gap-5 overflow-x-auto px-6 pb-1 md:mx-0 md:grid md:snap-none md:gap-8 md:overflow-visible md:px-0 ${COLUMNS[columns]}`}
        tabIndex={0}
      >
        {children}
      </ul>

      {/* Los controles solo existen donde existe el carrusel. */}
      {itemCount > 1 && (
        <div className="mt-6 flex items-center justify-between gap-6 md:hidden">
          <ul className="flex items-center gap-1">
            {Array.from({ length: itemCount }, (_, index) => (
              <li key={index}>
                <button
                  aria-current={index === active}
                  aria-label={interpolate(labels.slidePosition, {
                    n: index + 1,
                    total: itemCount,
                  })}
                  // El punto mide 8px, pero el botón mide 24: el área táctil mínima
                  // de WCAG 2.2 (2.5.8) es 24×24 CSS px y un target de 8px se falla
                  // sistemáticamente con el pulgar. El relleno es transparente.
                  className="flex h-6 w-6 items-center justify-center"
                  onClick={() => goTo(index)}
                  type="button"
                >
                  <span
                    aria-hidden="true"
                    className={`block h-2 w-2 rounded-full transition-colors duration-150 ${
                      index === active ? 'bg-accent' : 'bg-line-strong'
                    }`}
                  />
                </button>
              </li>
            ))}
          </ul>

          <div className="flex gap-2">
            <CarouselButton
              disabled={atStart}
              label={labels.previous}
              onClick={() => goTo(active - 1)}
            >
              ←
            </CarouselButton>
            <CarouselButton disabled={atEnd} label={labels.next} onClick={() => goTo(active + 1)}>
              →
            </CarouselButton>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * `disabled` real y no `aria-disabled`: en los extremos el botón no tiene ninguna
 * acción que ofrecer, y dejarlo enfocable solo agrega una parada muerta en el tabulado.
 */
function CarouselButton({
  children,
  disabled,
  label,
  onClick,
}: {
  children: ReactNode;
  disabled: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-md border border-line text-muted transition-colors duration-150 hover:border-line-strong hover:text-heading disabled:opacity-35 disabled:hover:border-line disabled:hover:text-muted"
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <span aria-hidden="true">{children}</span>
    </button>
  );
}
