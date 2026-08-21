import type { Profile } from '@/types/profile';

/**
 * Encabezado de las páginas internas: un `<h1>` y una bajada.
 *
 * Un `<h1>` por página y que describa esa página —no el nombre del sitio repetido cinco
 * veces—: es lo que le dice a un buscador y a un lector de pantalla de qué trata el
 * documento. Antes había un solo `<h1>` en todo el sitio, con el nombre, y las secciones
 * colgaban de él como `<h2>`; con rutas reales, cada una necesita el suyo.
 */
export function PageHeader({ meta }: { meta: Profile['pages'][keyof Profile['pages']] }) {
  return (
    <header className="mx-auto max-w-[1120px] px-6 pb-10 pt-16 md:px-10 md:pb-14 md:pt-24">
      <p className="eyebrow rise">{meta.navLabel}</p>
      <h1 className="display rise mt-4" style={{ animationDelay: '60ms' }}>
        {meta.heading}
      </h1>
      <p className="measure rise mt-6 text-pretty" style={{ animationDelay: '120ms' }}>
        {meta.description}
      </p>
    </header>
  );
}
