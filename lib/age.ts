import 'server-only';

/**
 * Edad, calculada — nunca escrita.
 *
 * **Por qué no es un dato de contenido.** "29 años" es correcto hasta el 9 de febrero y
 * después es falso, sin que nada avise. Es la peor clase de dato: se rompe solo, en
 * silencio, y el único que se entera es quien lo lee. Un número que depende del día de
 * hoy no puede vivir en un JSON.
 *
 * **Por qué la fecha va en el entorno y no en el contenido.** El repositorio es público.
 * Una fecha de nacimiento completa junto al nombre y apellido es exactamente el par que
 * se usa para suplantar identidad, y el historial de Git no se puede retirar. Mismo
 * tratamiento que `CONTACT_PHONE_E164`: el dato sensible entra por variable de entorno y
 * lo que se publica es su derivado. Acá se publica la edad; la fecha no sale nunca.
 */

/**
 * Años cumplidos a la fecha dada.
 *
 * Se compara mes y día en vez de dividir la diferencia por 365,25: dividir se equivoca
 * con los bisiestos justo alrededor del cumpleaños, que es el único momento en que a
 * alguien le importa que el número esté bien.
 *
 * Se trabaja en UTC a propósito. La consecuencia conocida y aceptada: el día del
 * cumpleaños el número cambia unas horas antes en Argentina (UTC-3) que en el reloj de
 * casa. Corregirlo exigiría arrastrar una zona horaria por todo el sistema para ganar
 * tres horas de exactitud en un dato que se expresa en años.
 */
export function yearsOld(birthDate: Date, now: Date = new Date()): number {
  let age = now.getUTCFullYear() - birthDate.getUTCFullYear();

  const monthDelta = now.getUTCMonth() - birthDate.getUTCMonth();
  const dayDelta = now.getUTCDate() - birthDate.getUTCDate();
  if (monthDelta < 0 || (monthDelta === 0 && dayDelta < 0)) age -= 1;

  return age;
}

/**
 * Parseo estricto de `YYYY-MM-DD`.
 *
 * `new Date(string)` acepta basura y devuelve fechas plausibles —`new Date('1997-02-30')`
 * no falla— así que se verifica que los componentes sobrevivan la ida y vuelta. Una fecha
 * malformada devuelve `null` y el sistema se comporta como si no estuviera configurada,
 * que es la regla del proyecto: ausencia igual a degradación prevista.
 */
export function parseBirthDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));

  const survivesRoundTrip =
    date.getUTCFullYear() === Number(year) &&
    date.getUTCMonth() === Number(month) - 1 &&
    date.getUTCDate() === Number(day);

  return survivesRoundTrip ? date : null;
}
