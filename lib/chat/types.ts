/**
 * Contrato del chatbot. Nada de esto depende de un proveedor concreto.
 *
 * La forma es deliberadamente pobre: un turno es un rol y un texto. Sin adjuntos, sin
 * herramientas, sin llamadas a función. El chatbot del portfolio responde sobre un
 * corpus fijo y no tiene efectos: darle una superficie más rica sería darle capacidades
 * que no necesita y que después hay que auditar.
 */

/**
 * El rol `system` NO existe acá a propósito.
 *
 * El prompt de sistema lo construye el servidor (`lib/chat/system-prompt.ts`) y nunca
 * viaja en la conversación. Si `ChatRole` incluyera `'system'`, un cliente podría
 * mandar un turno con ese rol y reescribir las reglas del bot — que es exactamente el
 * ataque que la regla "el input del usuario va siempre en el turno `user`" evita.
 * El tipo hace cumplir la regla; no hay que acordarse de validarla.
 */
export type ChatRole = 'assistant' | 'user';

export interface ChatMessage {
  readonly content: string;
  readonly role: ChatRole;
}

export interface LlmStreamRequest {
  /** Turnos de la conversación, ya validados y saneados. Nunca incluye el sistema. */
  readonly messages: readonly ChatMessage[];
  /** Tope duro de tokens de salida. Es la mitad del control de gasto. */
  readonly maxOutputTokens: number;
  /** Instrucciones y corpus. Lo arma el servidor; nunca viene del cliente. */
  readonly system: string;
}

/**
 * Un proveedor de LLM.
 *
 * Devuelve texto en trozos y nada más: sin objetos de uso, sin metadatos del proveedor,
 * sin tipos propios de un SDK. Todo lo que se filtre por acá se vuelve una dependencia
 * del resto del sistema con el proveedor concreto, y el motivo de tener la interfaz es
 * justamente que no exista esa dependencia.
 */
export interface LlmProvider {
  /** Nombre para logs y errores. No se expone al cliente. */
  readonly name: string;
  /** Emite fragmentos de texto a medida que el modelo los produce. */
  stream(request: LlmStreamRequest): AsyncIterable<string>;
}

/** Error del proveedor con una causa clasificada, para poder responder distinto. */
export class LlmProviderError extends Error {
  constructor(
    message: string,
    readonly reason: 'auth' | 'network' | 'quota' | 'rate-limit' | 'unknown',
  ) {
    super(message);
    this.name = 'LlmProviderError';
  }
}
