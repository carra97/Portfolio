'use client';

import { useEffect, useRef, type ReactNode } from 'react';

/**
 * Lista ordenada que marca `data-reached` en cada `<li>` cuando su borde superior cruza
 * una línea al 70% de la pantalla. El CSS hace el resto (`globals.css`, línea de tiempo):
 * el punto salta al hito alcanzado, el anterior queda gris y el texto se enciende.
 *
 * El scroll **dispara** el paso, no lo arrastra: llegar a un hito lanza una animación de
 * duración fija hasta el siguiente nodo. Al subir, el hito vuelve a "no alcanzado".
 *
 * `data-armed` se pone recién al hidratar y solo sin movimiento reducido: sin JavaScript,
 * o con `prefers-reduced-motion`, la línea se ve completa y estática, como siempre.
 */
export function TimelineProgress({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const list = ref.current;
    if (!list || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          // Alcanzado = el borde de arriba ya pasó la línea. Sigue alcanzado aunque el
          // hito salga de la pantalla por arriba.
          const line = entry.rootBounds?.bottom ?? window.innerHeight * 0.7;
          entry.target.toggleAttribute('data-reached', entry.boundingClientRect.top < line);
        }
      },
      { rootMargin: '0px 0px -30% 0px' },
    );

    for (const item of list.children) observer.observe(item);
    list.setAttribute('data-armed', '');

    return () => {
      observer.disconnect();
      list.removeAttribute('data-armed');
    };
  }, []);

  return (
    <ol ref={ref} className="journey">
      {children}
    </ol>
  );
}
