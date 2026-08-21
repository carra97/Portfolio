#!/usr/bin/env node
/**
 * Guardarraíl de contenido.
 *
 *   node scripts/content-check.mjs
 *
 * Recorre todos los strings de `content/*.json` y falla si aparece algo que las reglas
 * del proyecto prohíben publicar. Se corre en el build y antes de cualquier deploy.
 *
 * **Por qué existe.** El corpus del chatbot se deriva del contenido publicado
 * (`lib/chat/corpus.ts`), así que este chequeo cubre las dos superficies a la vez: lo
 * que muestra el sitio y lo que el bot puede afirmar. Una regla escrita solo en el prompt
 * de sistema es una regla que el modelo *podría* ignorar; una regla que rompe el build
 * es una regla que se cumple.
 *
 * No reemplaza al criterio humano —no detecta una inferencia mal encuadrada— pero cierra
 * la clase de error que ya nos pasó dos veces: un dato que no debía salir, saliendo
 * porque alguien editó un JSON sin releer las reglas.
 */

import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const CONTENT_DIR = new URL('../content/', import.meta.url);

/**
 * Cada regla dice qué busca y por qué está prohibido. El `why` no es decorativo: cuando
 * esto falle dentro de seis meses, la persona que lo vea necesita entender la regla sin
 * ir a buscar el documento que la definió.
 */
const RULES = [
  {
    id: 'monto-ahorro-llm',
    pattern: /34[.,]?500|USD\s?34|34\s?mil/i,
    why: 'El monto exacto de ahorro en LLM no se publica en el sitio. Usar la versión cualitativa. (El PDF del CV es una excepción explícita decidida el 2026-08-21 y vive fuera de content/.)',
  },
  {
    id: 'anos-inflados',
    pattern: /\b(4\+|5\+)\s*años|\bcuatro años de experiencia|\bcinco años de experiencia/i,
    why: 'Anchor fact: la experiencia es 3+ años. Nunca 4+ ni 5+.',
  },
  {
    id: 'cargo-futuro-como-actual',
    pattern: /\b(actualmente|hoy|es)\s+(Technical Leader|AI Solutions Architect)/i,
    why: 'Technical Leader y AI Solutions Architect son objetivos futuros, no cargos ocupados.',
  },
  {
    id: 'telefono-en-contenido',
    pattern: /\+?54\s?9?\s?343\s?\d{6,}|543434251515/,
    why: 'El teléfono se lee de CONTACT_PHONE_E164, no se escribe en el contenido: así no queda en el historial de Git.',
  },
  {
    id: 'secreto-aparente',
    pattern: /sk-[a-z0-9-]{16,}|api[_-]?key\s*[:=]\s*["'][^"']{12,}/i,
    why: 'Parece una credencial. Nada parecido a una clave puede vivir en el contenido.',
  },
  {
    id: 'rag-como-logro-propio',
    pattern: /(construí|desarrollé|diseñé|armé)\s+(el\s+)?(sistema\s+de\s+)?RAG\b/i,
    why: 'RAG no se publica como logro propio: el servicio de recuperación no tiene commits suyos. Lo publicable son los agentes y skills que lo consumen.',
  },
];

const files = (await readdir(CONTENT_DIR)).filter((name) => name.endsWith('.json'));
const violations = [];

for (const file of files) {
  const raw = await readFile(new URL(file, CONTENT_DIR), 'utf8');
  const data = JSON.parse(raw);

  for (const { path, value } of walk(data)) {
    for (const rule of RULES) {
      const match = value.match(rule.pattern);
      if (match) {
        violations.push({ file, path, rule, excerpt: excerptAround(value, match.index ?? 0) });
      }
    }
  }
}

if (violations.length === 0) {
  const count = files.length;
  process.stdout.write(`✓ contenido limpio · ${count} archivo(s) · ${RULES.length} reglas verificadas\n`);
  process.exit(0);
}

process.stderr.write(`\n✗ ${violations.length} violación(es) de las reglas de publicación\n\n`);
for (const violation of violations) {
  process.stderr.write(`  ${violation.file} → ${violation.path}\n`);
  process.stderr.write(`  regla: ${violation.rule.id}\n`);
  process.stderr.write(`  motivo: ${violation.rule.why}\n`);
  process.stderr.write(`  texto: …${violation.excerpt}…\n\n`);
}
process.exit(1);

/** Recorre el JSON entero y devuelve cada string con su ruta, para poder señalarla. */
function* walk(node, path = '') {
  if (typeof node === 'string') {
    yield { path: path || '(raíz)', value: node };
    return;
  }
  if (Array.isArray(node)) {
    for (const [index, item] of node.entries()) yield* walk(item, `${path}[${index}]`);
    return;
  }
  if (node && typeof node === 'object') {
    for (const [key, item] of Object.entries(node)) yield* walk(item, path ? `${path}.${key}` : key);
  }
}

function excerptAround(value, index) {
  const start = Math.max(0, index - 40);
  return value.slice(start, index + 60).replace(/\s+/g, ' ');
}
