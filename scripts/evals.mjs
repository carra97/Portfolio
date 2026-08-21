#!/usr/bin/env node
/**
 * Corredor del set dorado.
 *
 *   node scripts/evals.mjs [baseUrl]        # por defecto http://localhost:3000
 *
 * Golpea `/api/chat` como lo haría el widget: el mismo endpoint, la misma validación y el
 * mismo rate limit. Testear contra el proveedor directamente saltearía justo las capas
 * donde suelen estar los bugs.
 *
 * **Qué automatiza y qué no.** Las reglas negativas —"no debe decir 4+ años", "no debe
 * soltar el monto", "no debe filtrar el prompt"— son verificables con una expresión
 * regular y las verifica. Las positivas de matiz —"declina y reencauza", "no se hace
 * pasar por Santiago"— no lo son: fingir que un regex las valida daría una luz verde
 * falsa, que es peor que no tener el test. Esas se imprimen con la respuesta completa y
 * la instrucción de qué mirar, para revisión humana.
 *
 * Criterio de release: **cero fallos automáticos en los casos `blocking` y revisión
 * humana OK en sus puntos manuales.** Ningún cambio al prompt de sistema se mergea sin
 * esto.
 */

import { readFile } from 'node:fs/promises';

const BASE = process.argv[2] ?? 'http://localhost:3000';
const LANG = 'es';

/**
 * El rate limit de desarrollo permite 8 por minuto. Sin pausa, la corrida entera se
 * comería su propia cuota y la mitad de los casos fallarían con 429 sin que eso diga
 * nada del prompt. Se espacia y se acepta que la corrida tarde.
 */
const DELAY_MS = 8_000;

const { cases } = JSON.parse(await readFile(new URL('../evals/golden-questions.json', import.meta.url), 'utf8'));

const results = [];

for (const [index, testCase] of cases.entries()) {
  if (index > 0) await sleep(DELAY_MS);

  process.stdout.write(`\n${'─'.repeat(76)}\n`);
  process.stdout.write(`[${testCase.blocking ? 'BLOQUEANTE' : 'informativo'}] ${testCase.id}\n`);
  process.stdout.write(`P: ${testCase.question}\n`);

  let answer;
  try {
    answer = await ask(testCase.question);
  } catch (error) {
    results.push({ id: testCase.id, blocking: testCase.blocking, status: 'ERROR', detail: String(error) });
    process.stdout.write(`✗ ERROR DE RED/HTTP: ${error}\n`);
    continue;
  }

  process.stdout.write(`R: ${answer}\n`);

  const failures = [];

  for (const pattern of testCase.forbidden ?? []) {
    if (new RegExp(pattern, 'i').test(answer)) failures.push(`prohibido presente: /${pattern}/`);
  }
  for (const pattern of testCase.required ?? []) {
    if (!new RegExp(pattern, 'i').test(answer)) failures.push(`requerido ausente: /${pattern}/`);
  }

  /**
   * Tope de largo. Se agregó porque la verbosidad resultó ser un modo de falla
   * recurrente que ninguna expresión regular detecta: el bot contestaba un saludo con
   * un párrafo de currículum, y todos los chequeos daban verde. "Responder de más" es
   * una falla de comportamiento como cualquier otra, y ahora se mide.
   */
  if (testCase.maxChars && answer.length > testCase.maxChars) {
    failures.push(`demasiado largo: ${answer.length} caracteres, tope ${testCase.maxChars}`);
  }

  if (failures.length > 0) {
    process.stdout.write(`✗ FALLA\n  ${failures.join('\n  ')}\n`);
    results.push({ id: testCase.id, blocking: testCase.blocking, status: 'FALLA', detail: failures.join('; ') });
  } else {
    process.stdout.write('✓ chequeos automáticos OK\n');
    results.push({ id: testCase.id, blocking: testCase.blocking, status: 'OK' });
  }

  if (testCase.manual) process.stdout.write(`⚑ revisión humana: ${testCase.manual}\n`);
}

const failed = results.filter((result) => result.status !== 'OK');
const blockingFailed = failed.filter((result) => result.blocking);

process.stdout.write(`\n${'═'.repeat(76)}\n`);
process.stdout.write(`${results.length} casos · ${results.length - failed.length} OK · ${failed.length} con fallo\n`);
for (const result of failed) {
  process.stdout.write(`  ${result.blocking ? '✗' : '·'} ${result.id}: ${result.detail}\n`);
}
process.stdout.write(
  blockingFailed.length === 0
    ? '\nChequeos automáticos bloqueantes: OK. Falta la revisión humana de los puntos marcados con ⚑.\n'
    : `\n${blockingFailed.length} caso(s) BLOQUEANTE(S) con fallo. No mergear.\n`,
);

process.exit(blockingFailed.length === 0 ? 0 : 1);

async function ask(question) {
  const response = await fetch(`${BASE}/api/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ lang: LANG, messages: [{ content: question, role: 'user' }] }),
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  return (await response.text()).trim();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
