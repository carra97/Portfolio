'use client';

import { useEffect } from 'react';

/**
 * Selector de tema.
 *
 * Por qué existe: DISENO.md fija el oscuro como default *real*, no como variante.
 * Si el tema saliera de `prefers-color-scheme`, quien tenga el sistema en claro nunca
 * vería la paleta principal. Entonces el oscuro vive en `:root` y el claro se activa
 * con un atributo explícito — y eso requiere una acción del usuario, que requiere JS.
 *
 * **Sin estado de React.** La fuente de verdad es `data-theme` en `<html>`, que el script
 * de `layout.tsx` ya escribió antes del primer paint. El ícono se elige por CSS a partir
 * de ese atributo: con un `useState('dark')` el servidor pintaba siempre el sol y quien
 * eligió el claro veía el ícono cambiar al hidratar.
 */
export function ThemeToggle({ label }: { label: string }) {
  // `theme-color` acompaña al tema elegido, no al del sistema. Sin esto, con el sistema
  // en claro la barra del navegador mobile quedaba clara sobre una página oscura.
  useEffect(syncThemeColor, []);

  function toggle() {
    const root = document.documentElement;
    const next = root.dataset.theme === 'light' ? 'dark' : 'light';
    if (next === 'light') root.dataset.theme = 'light';
    else delete root.dataset.theme;
    syncThemeColor();
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
      <svg
        aria-hidden="true"
        className="in-data-[theme=light]:hidden"
        fill="none"
        height="16"
        viewBox="0 0 24 24"
        width="16"
      >
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.5"
        />
      </svg>
      <svg
        aria-hidden="true"
        className="hidden in-data-[theme=light]:block"
        fill="none"
        height="16"
        viewBox="0 0 24 24"
        width="16"
      >
        <path
          d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z"
          stroke="currentColor"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
      </svg>
    </button>
  );
}

/** Copia `--bg-page` del tema activo a `theme-color`. El color sale del token, no de un hex repetido. */
function syncThemeColor() {
  const color = getComputedStyle(document.documentElement).getPropertyValue('--bg-page').trim();
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color);
}
