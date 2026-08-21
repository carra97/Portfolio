import Link from 'next/link';
import { routes } from '@/lib/routes';
import type { SupportedLocale } from '@/lib/i18n';
import type { Profile } from '@/types/profile';

/** Cuántos logros se muestran en la síntesis del home. El resto vive en /experience. */
const HIGHLIGHTS = 3;

/**
 * Rol actual, en la landing.
 *
 * Es una síntesis, no un resumen de la sección completa: el puesto vigente y sus tres
 * logros más fuertes. Los doce que tiene cargados no entran acá — meterlos convertiría
 * la landing en la página larga que estamos desarmando. El enlace al final es el
 * contrato con quien quiere más: existe, está a un click, y no cuesta scroll a quien
 * no lo quiere.
 *
 * Si ningún puesto está marcado `current`, la sección no se renderiza (lo decide
 * `isAvailable` en el registro): mejor ausencia que un encabezado vacío.
 */
export function CurrentRole({
  items,
  lang,
  ui,
}: {
  items: Profile['experience'];
  lang: SupportedLocale;
  ui: Profile['ui'];
}) {
  const job = items.find((item) => item.current);
  if (!job) return null;

  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-[0.12em] text-muted">{job.period}</p>

      <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h3 className="h3">{job.role}</h3>
        <span className="rounded-md bg-accent-bg px-2 py-0.5 font-mono text-xs uppercase tracking-[0.12em] text-accent">
          {ui.currentBadge}
        </span>
      </div>

      <p className="small mt-1">
        {job.company} · {job.location}
      </p>

      {job.context && <p className="measure mt-4 text-pretty text-quiet">{job.context}</p>}

      <ul className="mt-6 space-y-3">
        {job.achievements.slice(0, HIGHLIGHTS).map((achievement) => (
          <li key={achievement.slice(0, 40)} className="measure flex gap-4 text-pretty">
            <span aria-hidden="true" className="mt-3.5 h-px w-4 shrink-0 bg-accent-dim" />
            <span>{achievement}</span>
          </li>
        ))}
      </ul>

      <p className="mt-8">
        <Link className="prose-link" href={routes.experience(lang)}>
          {ui.viewExperience} →
        </Link>
      </p>
    </div>
  );
}
