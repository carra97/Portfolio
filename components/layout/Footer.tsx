import { env } from '@/lib/env';
import type { SupportedLocale } from '@/lib/i18n';
import { routes } from '@/lib/routes';
import type { Profile } from '@/types/profile';

/**
 * Footer.
 *
 * Lleva los enlaces de contacto directos —email, LinkedIn, GitHub— en todas las
 * páginas, no solo en `/contact`. El razonamiento: quien evalúa un perfil decide
 * escribir en el momento en que se convence, y ese momento puede ser leyendo un case
 * study. Obligarlo a navegar a otra página para encontrar el mail agrega un paso justo
 * donde menos conviene.
 *
 * El email sale de `lib/env` (server-only): si la variable falta, el enlace no se
 * renderiza. Nunca se emite un `mailto:` vacío.
 */
export function Footer({
  lang,
  name,
  ui,
}: {
  lang: SupportedLocale;
  name: string;
  ui: Profile['ui'];
}) {
  const hasEmail = env.CONTACT_EMAIL !== '';

  return (
    <footer className="border-t border-line">
      <div className="mx-auto max-w-[1120px] px-6 py-12 md:px-10">
        <ul className="flex flex-wrap gap-x-8 gap-y-3">
          {hasEmail && (
            <li>
              <a className="prose-link font-mono text-sm" href={`mailto:${env.CONTACT_EMAIL}`}>
                {env.CONTACT_EMAIL}
              </a>
            </li>
          )}
          <li>
            <a
              className="prose-link font-mono text-sm"
              href="https://www.linkedin.com/in/santiago-nicolas-carrattini"
              rel="noopener noreferrer"
              target="_blank"
            >
              LinkedIn
            </a>
          </li>
          <li>
            <a
              className="prose-link font-mono text-sm"
              href="https://github.com/carra97"
              rel="noopener noreferrer"
              target="_blank"
            >
              GitHub
            </a>
          </li>
          <li>
            <a className="prose-link font-mono text-sm" href={routes.contact(lang)}>
              {ui.footerContactLink}
            </a>
          </li>
        </ul>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-8">
          <p className="small">
            © {new Date().getFullYear()} {name}
          </p>
          <p className="font-mono text-xs tracking-[0.12em] text-muted">
            Next.js · TypeScript · Tailwind
          </p>
        </div>
      </div>
    </footer>
  );
}
