import { env } from '@/lib/env';
import type { Profile } from '@/types/profile';

const GITHUB_PROFILE = 'https://github.com/carra97';
const LINKEDIN_PROFILE = 'https://www.linkedin.com/in/santiago-nicolas-carrattini';
const REPOSITORY = 'https://github.com/carra97/Portfolio';

/**
 * Footer — bloque de metadata.
 *
 * Dos versiones anteriores fallaron por motivos opuestos y vale registrar los dos:
 *
 * - La primera era una fila de cuatro enlaces subrayados, todos del mismo peso. Sin
 *   jerarquía, y no decía nada que no estuviera ya en la página.
 * - La segunda agregaba un CTA de cierre y un mapa del sitio. El mapa **duplicaba el
 *   nav** —las siete rutas ya están arriba en todas las páginas— y el CTA duplicaba el
 *   del hero. 610px de alto para repetir cosas.
 *
 * Esta versión sigue una sola regla: **acá va únicamente lo que no está en otro lado de
 * la página.** Los destinos ya los cubre la barra superior; el botón de contacto, el nav
 * y el hero. Lo que no aparece en ningún lado es cómo llegarle por fuera del sitio
 * (email, LinkedIn, GitHub), qué se puede llevar (CV, código) y bajo qué condiciones
 * trabaja.
 *
 * El tratamiento es el mismo lenguaje de "metadata del documento" que usa el resto del
 * sitio: eyebrow en mono con tracking abierto, hairlines, tipografía apagada. Un footer
 * tiene que terminar la página, no disputarla.
 */
export function Footer({ lang: _lang, profile }: { lang: string; profile: Profile }) {
  const { hero, ui } = profile;
  const hasEmail = env.CONTACT_EMAIL !== '';

  return (
    <footer className="border-t border-line">
      <div className="mx-auto max-w-[1120px] px-6 md:px-10">
        {/* `divide-*` en vez de `gap` + bordes a mano: la línea vertical entre columnas
            la dibuja el contenedor, así ninguna columna necesita saber si es la primera. */}
        <div className="grid divide-y divide-line py-10 md:grid-cols-3 md:divide-x md:divide-y-0 md:py-12">
          <div className="pb-8 md:pb-0 md:pr-10">
            <p className="eyebrow">{ui.footerContactLabel}</p>
            <ul className="mt-4 space-y-2.5">
              {/* El email sale de `lib/env` (server-only): si la variable falta, el enlace
                  no se renderiza. Nunca se emite un `mailto:` vacío. */}
              {hasEmail && (
                <li>
                  <a className="footer-link" href={`mailto:${env.CONTACT_EMAIL}`}>
                    {env.CONTACT_EMAIL}
                  </a>
                </li>
              )}
              <li>
                <a
                  className="footer-link"
                  href={LINKEDIN_PROFILE}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  LinkedIn
                </a>
              </li>
              <li>
                <a
                  className="footer-link"
                  href={GITHUB_PROFILE}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </div>

          <div className="py-8 md:px-10 md:py-0">
            <p className="eyebrow">{ui.footerDownloadLabel}</p>
            <ul className="mt-4 space-y-2.5">
              {/* Sin archivo de CV no hay enlace, igual que el botón del hero. */}
              {hero.resumeUrl && (
                <li>
                  <a className="footer-link" download href={hero.resumeUrl}>
                    {ui.footerCvLink}
                  </a>
                </li>
              )}
              <li>
                <a
                  className="footer-link"
                  href={REPOSITORY}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {ui.footerRepoLink}
                </a>
              </li>
            </ul>
          </div>

          <div className="pt-8 md:pl-10 md:pt-0">
            <p className="eyebrow">{ui.footerAvailabilityLabel}</p>
            <p className="mt-4 text-pretty text-sm text-quiet">{hero.availability}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line py-6 font-mono text-xs uppercase tracking-[0.12em] text-muted">
          <p>
            © {new Date().getFullYear()} {hero.name}
          </p>
          {/* El stack no se traduce: son nombres propios. */}
          <p>Next.js · TypeScript · Tailwind</p>
        </div>
      </div>
    </footer>
  );
}
