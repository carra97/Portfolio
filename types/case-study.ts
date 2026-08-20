import type { Lang } from '@/types/profile';

/**
 * Case study — la página propia de un proyecto.
 *
 * La forma no es decorativa: es la diferencia entre un CV y un portfolio. Un CV dice
 * qué construiste; un case study dice **por qué lo construiste así y contra qué**.
 * Por eso `decisions` y `retrospective` son requeridos: un proyecto sin decisiones
 * explicadas y sin autocrítica no justifica una página, y en ese caso va como tarjeta
 * en el hub. El tipo hace cumplir esa vara.
 *
 * `metrics` y `diagram` son opcionales porque no todo proyecto tiene una métrica
 * publicable ni una arquitectura que valga la pena diagramar. Todo lo demás, no.
 */

export interface CaseStudy {
  readonly architecture: string;
  /** Qué limitó las decisiones: presupuesto, stack heredado, política, tiempos. */
  readonly constraints: readonly string[];
  readonly context: string;
  readonly decisions: readonly Decision[];
  readonly diagram?: string;
  readonly lang: Lang;
  readonly metrics?: readonly Metric[];
  readonly outcome: readonly string[];
  readonly problem: readonly string[];
  /** Qué haría distinto hoy. Un semi-senior cuenta qué hizo; un senior, qué cambiaría. */
  readonly retrospective: readonly string[];
  readonly slug: string;
  readonly summary: string;
  readonly tech: readonly string[];
  readonly title: string;
}

export interface Decision {
  /** Qué se resignó. Sin esto es una lista de tecnologías, no una decisión. */
  readonly tradeoff: string;
  readonly rationale: string;
  readonly title: string;
}

export interface Metric {
  readonly label: string;
  readonly note?: string;
  readonly value: string;
}
