import 'server-only';

import { existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Presencia de un archivo de `public/`, resuelta una sola vez.
 *
 * **Por qué existe.** El avatar de Raukar es un archivo binario que no vive en el
 * repositorio de contenido: se agrega aparte. Referenciarlo a ciegas significa que, si
 * falta, el navegador pide una imagen que devuelve 404 y queda el ícono roto — el peor
 * resultado posible, porque se ve mal y no dice qué pasó.
 *
 * Con esto la ausencia se convierte en una degradación prevista: sin el archivo, el
 * avatar cae al monograma y no se pide nada. Es la misma regla que gobierna el resto del
 * proyecto — ausencia = degradación silenciosa y decidida; presencia inválida = error
 * ruidoso.
 *
 * El chequeo es síncrono a propósito y se memoiza: corre en build, donde se prerenderizan
 * las páginas, y una sola vez por proceso.
 */
const cache = new Map<string, string | null>();

export function publicAsset(fileName: string): string | null {
  const cached = cache.get(fileName);
  if (cached !== undefined) return cached;

  const href = existsSync(join(process.cwd(), 'public', fileName)) ? `/${fileName}` : null;
  cache.set(fileName, href);
  return href;
}
