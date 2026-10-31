/**
 * Duraciones de experiencia, calculadas — mismo criterio que la edad en `lib/age.ts`: un
 * número que depende del día de hoy no puede vivir en un JSON.
 *
 * Existe porque el bot, sin esto, hacía la cuenta él: dijo "tres años y medio" cuando
 * eran tres y tres meses. Y con la regla de no calcular, se negaba a contestar cuánto
 * tiempo estuvo en cada puesto, que es lo primero que un recruiter repregunta.
 *
 * Se cuenta en meses de diferencia entre el mes de inicio y el de fin, sin contar el mes
 * de cierre: así los puestos consecutivos que comparten mes (Dic 2025) suman exacto el
 * total, sin un mes fantasma.
 */

const MONTHS: Readonly<Record<string, number>> = {
  ene: 0, jan: 0, feb: 1, mar: 2, abr: 3, apr: 3, may: 4, jun: 5,
  jul: 6, ago: 7, aug: 7, sep: 8, oct: 9, nov: 10, dic: 11, dec: 11,
};

/** `"Jul 2023 – Dic 2025"` o `"Dic 2025 – Presente"` → meses transcurridos. */
export function periodMonths(period: string, now: Date = new Date()): number | null {
  const match = /^(\p{L}{3}) (\d{4}) – (?:(\p{L}{3}) (\d{4})|\p{L}+)$/u.exec(period.trim());
  if (!match) return null;

  const [, startMonth, startYear, endMonth, endYear] = match;
  const start = monthIndex(startMonth, startYear);
  const end = endMonth ? monthIndex(endMonth, endYear) : now.getUTCFullYear() * 12 + now.getUTCMonth();
  if (start === null || end === null || end < start) return null;

  return end - start;
}

/** En español: el corpus va en español en los dos idiomas y el bot traduce al responder. */
export function formatMonths(months: number): string {
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const parts = [
    years > 0 ? `${years} ${years === 1 ? 'año' : 'años'}` : '',
    rest > 0 || years === 0 ? `${rest} ${rest === 1 ? 'mes' : 'meses'}` : '',
  ].filter(Boolean);
  return parts.join(' y ');
}

function monthIndex(month: string | undefined, year: string | undefined): number | null {
  const index = month ? MONTHS[month.toLowerCase()] : undefined;
  return index === undefined || !year ? null : Number(year) * 12 + index;
}
