import type { Profile } from '@/types/profile';

/**
 * Único momento de movimiento protagonista del sitio (DISENO.md §5): entrada
 * escalonada eyebrow → nombre → descripción → CTA, 60ms entre elementos, una sola vez.
 * Nada acá se mueve en loop.
 */
export function Hero({ hero }: { hero: Profile['hero'] }) {
  return (
    <header className="mx-auto max-w-[1120px] px-6 pb-20 pt-24 md:px-10 md:pb-32 md:pt-36" id="top">
      <p className="eyebrow rise" style={{ animationDelay: '0ms' }}>
        {hero.eyebrow}
      </p>

      <h1 className="display rise mt-6" style={{ animationDelay: '60ms' }}>
        {hero.name}
      </h1>

      <p
        className="rise mt-4 font-mono text-sm uppercase tracking-[0.12em] text-accent"
        style={{ animationDelay: '120ms' }}
      >
        {hero.headline}
      </p>

      <p
        className="measure rise mt-8 text-pretty"
        style={{ animationDelay: '180ms' }}
      >
        {hero.tagline}
      </p>

      <div className="rise mt-10 flex flex-wrap items-center gap-4" style={{ animationDelay: '240ms' }}>
        <a
          className="rounded-md bg-accent px-5 py-2.5 font-medium text-accent-on transition-colors duration-150 hover:bg-accent-hover"
          href="#contacto"
        >
          Hablemos
        </a>
        <span className="small">{hero.availability}</span>
      </div>
    </header>
  );
}
