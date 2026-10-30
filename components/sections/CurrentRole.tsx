import Link from 'next/link';
import { JobRow } from '@/components/sections/Experience';
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
    <JobRow
      achievements={job.achievements.slice(0, HIGHLIGHTS)}
      currentBadge={ui.currentBadge}
      job={job}
    >
      <p className="mt-8">
        <Link className="prose-link" href={routes.experience(lang)}>
          {ui.viewExperience}
        </Link>
      </p>
    </JobRow>
  );
}
