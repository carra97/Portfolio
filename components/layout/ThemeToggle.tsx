'use client';

import { useEffect, useState } from 'react';

/**
 * Único componente de cliente del sitio estático.
 *
 * Por qué existe: DISENO.md fija el oscuro como default *real*, no como variante.
 * Si el tema saliera de `prefers-color-scheme`, quien tenga el sistema en claro nunca
 * vería la paleta principal. Entonces el oscuro vive en `:root` y el claro se activa
 * con un atributo explícito — y eso requiere una acción del usuario, que requiere JS.
 *
 * Es la única excepción a "cero JavaScript de cliente", y son ~40 líneas.
 * El estado es local al componente: no hay store global ni rerender del sitio.
 */
export function ThemeToggle({ label }: { label: string }) {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const stored = document.documentElement.dataset.theme;
    if (stored === 'light') setTheme('light');
  }, []);

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    if (next === 'light') document.documentElement.dataset.theme = 'light';
    else delete document.documentElement.dataset.theme;
    try {
      localStorage.setItem('theme', next);
    } catch {
      // Modo privado o storage bloqueado: el tema simplemente no persiste. No es un error.
    }
  }

  return (
    <button
      aria-label={label}
      className="rounded-md border border-line px-2.5 py-1.5 text-muted transition-colors duration-150 hover:border-line-strong hover:text-heading"
      onClick={toggle}
      type="button"
    >
      {/* Íconos inline: un paquete de iconos por dos glifos no se justifica. */}
      {theme === 'dark' ? (
        <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 24 24" width="16">
          <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.5"
          />
        </svg>
      ) : (
        <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 24 24" width="16">
          <path
            d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
        </svg>
      )}
    </button>
  );
}
