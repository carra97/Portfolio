'use client';

import { useEffect, useRef, type ReactNode } from 'react';

/**
 * Repite las animaciones CSS de su contenido cada vez que vuelve a entrar en pantalla.
 *
 * Cuando el bloque sale entero de la vista, marca `data-idle`: el CSS le saca la
 * animación (`globals.css`), así que vuelve a su estado inicial sin que nadie lo vea.
 * Cuando vuelve a asomar, se quita la marca y la animación arranca de cero, con sus
 * retardos. La animación es CSS; esto solo decide cuándo corre.
 *
 * Sin JavaScript —o antes de hidratar— no hay marca: lo que está a la vista se anima al
 * cargar y lo demás queda en su estado final. Nunca un contenido que no aparece.
 */
export function ReplayOnView({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Arranca apenas asoma: si esperara a un porcentaje, entre el borde y ese umbral se
    // vería el estado final y después el salto al inicial.
    const observer = new IntersectionObserver(([entry]) => {
      if (entry) element.toggleAttribute('data-idle', !entry.isIntersecting);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
