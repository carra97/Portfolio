import { z } from 'zod';

import { LOCALES } from '@/lib/i18n';

/**
 * Validación del request del chat.
 *
 * Los topes no son estilo: son la mitad barata del control de gasto. Lo que entra
 * determina lo que se paga, y el momento de acotarlo es antes de llamar al modelo, no
 * después de recibir la factura.
 *
 * - `MAX_MESSAGE_CHARS` acota el turno individual.
 * - `MAX_MESSAGES` acota el historial: sin tope, un cliente puede reenviar una
 *   conversación de mil turnos y hacer que el corpus se procese contra todos ellos.
 * - El tope de salida vive en el endpoint (`maxOutputTokens`), que es la otra mitad.
 *
 * `.strict()` rechaza propiedades desconocidas en vez de ignorarlas: si el cliente manda
 * un campo que el servidor no espera, es un bug o un intento, y en los dos casos conviene
 * que falle ruidosamente.
 */

export const MAX_MESSAGE_CHARS = 1_000;
export const MAX_MESSAGES = 12;

const chatMessageSchema = z
  .object({
    content: z.string().trim().min(1).max(MAX_MESSAGE_CHARS),
    // Solo `assistant` y `user`. Un turno `system` enviado por el cliente sería una
    // reescritura de las reglas: acá se rechaza, y el tipo `ChatRole` ni siquiera lo
    // puede expresar.
    role: z.enum(['assistant', 'user']),
  })
  .strict();

export const chatRequestSchema = z
  .object({
    lang: z.enum(LOCALES),
    messages: z.array(chatMessageSchema).min(1).max(MAX_MESSAGES),
  })
  .strict()
  /**
   * El último turno tiene que ser del usuario. Un historial que termina en `assistant`
   * significa que no hay nada nuevo que responder: o es un cliente con un bug, o alguien
   * probando de hacer que el modelo continúe un texto que él mismo escribió como si
   * fuera del asistente.
   */
  .refine((request) => request.messages.at(-1)?.role === 'user', {
    message: 'El último mensaje debe ser del usuario',
    path: ['messages'],
  });

export type ChatRequest = z.infer<typeof chatRequestSchema>;
