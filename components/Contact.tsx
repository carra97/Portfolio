import { env, whatsappDigits } from '@/lib/env';

/**
 * Server Component: `lib/env` está marcado `server-only`, así que email y teléfono se
 * resuelven en el servidor y llegan al cliente ya renderizados en el HTML. Nada de
 * `NEXT_PUBLIC_`.
 *
 * Degradación prevista: si una env var falta, su CTA no se renderiza. Nunca se emite un
 * `wa.me/` o un `mailto:` vacío — es peor que no tener botón, porque parece funcionar.
 */
export function Contact({
  emailLabel,
  intro,
  subject,
  whatsappLabel,
}: {
  emailLabel: string;
  intro: string;
  subject: string;
  whatsappLabel: string;
}) {
  const hasEmail = env.CONTACT_EMAIL !== '';
  const hasWhatsApp = whatsappDigits !== '';

  return (
    <div>
      <p className="measure text-pretty">{intro}</p>

      <div className="mt-8 flex flex-wrap gap-3">
        {hasWhatsApp && (
          <a
            className="rounded-md bg-accent px-5 py-2.5 font-medium text-accent-on transition-colors duration-150 hover:bg-accent-hover"
            href={`https://wa.me/${whatsappDigits}`}
            rel="noopener noreferrer"
            target="_blank"
          >
            {whatsappLabel}
          </a>
        )}
        {hasEmail && (
          <a
            className="rounded-md border border-line px-5 py-2.5 transition-colors duration-150 hover:border-line-strong hover:text-heading"
            href={`mailto:${env.CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}`}
          >
            {emailLabel}
          </a>
        )}
      </div>

      <ul className="mt-8 flex flex-wrap gap-x-8 gap-y-2">
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
      </ul>
    </div>
  );
}
