'use client';

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';

/**
 * La lista de destinos del nav, deslizable en un teléfono, con flechas que avisan que
 * sigue hacia cada lado. Un menú que solo se corta en el borde no se lee como deslizable.
 *
 * Las flechas son botones de verdad —deslizan el menú al tocarlas— y cada una
 * desaparece cuando ya no queda nada de su lado. Desde md la lista entra entera y nada
 * de esto se ve.
 */
export function NavScroller({
  children,
  labels,
}: {
  children: ReactNode;
  labels: { readonly next: string; readonly previous: string };
}) {
  const ref = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ after: false, before: false });

  // El nav se monta en cada página: antes de pintar, se desliza para que el destino actual
  // se vea entero y el siguiente también, aunque estuviera cortado en el borde.
  useLayoutEffect(() => {
    const list = ref.current;
    const current = list?.querySelector('[aria-current="page"]')?.closest('li');
    if (!list || !current) return;

    const bounds = list.getBoundingClientRect();
    const end = (current.nextElementSibling ?? current).getBoundingClientRect().right;
    if (end > bounds.right) list.scrollLeft += end - bounds.right;
    const start = current.getBoundingClientRect().left;
    if (start < bounds.left) list.scrollLeft -= bounds.left - start;
  }, []);

  useEffect(() => {
    const list = ref.current;
    if (!list) return;

    const update = () =>
      setEdges({
        after: list.scrollLeft + list.clientWidth < list.scrollWidth - 4,
        before: list.scrollLeft > 4,
      });
    update();
    list.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      list.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  const slide = (direction: 1 | -1) => {
    const list = ref.current;
    if (!list) return;
    list.scrollBy({
      left: direction * list.clientWidth * 0.6,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    });
  };

  return (
    <div className="relative order-last w-full md:order-none md:w-auto md:flex-1">
      <ul
        ref={ref}
        className="flex gap-5 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </ul>
      {edges.before && (
        <NavArrow label={labels.previous} onClick={() => slide(-1)} side="left">
          ‹
        </NavArrow>
      )}
      {edges.after && (
        <NavArrow label={labels.next} onClick={() => slide(1)} side="right">
          ›
        </NavArrow>
      )}
    </div>
  );
}

/**
 * `tabIndex={-1}`: con teclado, el foco ya desliza la lista hasta cada destino. La flecha
 * va en el margen de página (24px), afuera de la lista: no tapa ningún destino.
 */
function NavArrow({
  children,
  label,
  onClick,
  side,
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
  side: 'left' | 'right';
}) {
  return (
    <button
      aria-label={label}
      className={`absolute inset-y-0 flex w-6 items-center justify-center text-heading md:hidden ${
        side === 'left' ? '-left-6' : '-right-6'
      }`}
      onClick={onClick}
      tabIndex={-1}
      type="button"
    >
      <span aria-hidden="true">{children}</span>
    </button>
  );
}
