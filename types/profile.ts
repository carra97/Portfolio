/**
 * Esquema de contenido del portfolio.
 *
 * Dos fuentes, por decisión explícita del plan (§3.7):
 * - `contenido/perfil-publico.md`  → todo lo profesional. Se sincroniza desde `Carrera`.
 * - `contenido/perfil-personal.md` → trayectoria y hobbies. Nativo de `Portfolio`.
 *
 * Si un dato no está en una de las dos, no se agrega acá. El tipo es la barrera.
 *
 * Convención: interfaces y sus miembros en orden alfabético.
 *
 * Por qué union types y no `string` suelto: cada uno gobierna una decisión de render.
 * `ProjectStatus: 'archived'` implica que el proyecto NO se enlaza — regla explícita del
 * dossier, hecha cumplir por el compilador y no por la memoria de quien edita el JSON.
 * `TestimonialRelation` garantiza que toda recomendación declare la relación de quien la
 * escribió: que dos personas a las que lideró avalen su liderazgo dice algo que una
 * recomendación de un par no dice. En cambio `stack` y `tech` quedan `string[]`: listas
 * abiertas que no gobiernan ningún render.
 */

export interface CertificationGroup {
  /** Marco que convierte una lista de badges en una ruta de formación. */
  readonly framing?: string;
  readonly issuer: string;
  readonly items: readonly string[];
  readonly year?: string;
}

export interface Education {
  readonly institution: string;
  readonly note?: string;
  readonly title: string;
  readonly year?: string;
}

export interface Experience {
  readonly achievements: readonly string[];
  readonly company: string;
  readonly context?: string;
  readonly current: boolean;
  readonly location: string;
  readonly period: string;
  readonly role: string;
  readonly stack: readonly string[];
}

export interface Hobby {
  /** Una línea con contenido real. Un hobby listado no dice nada; descripto, sí. */
  readonly detail: string;
  /** 'lead' se destaca con foto; el resto va compacto. Nada de grilla de íconos. */
  readonly emphasis: HobbyEmphasis;
  readonly name: string;
}

export type HobbyEmphasis = 'compact' | 'lead';

export type Lang = 'en' | 'es';

export interface Milestone {
  /** Año o etapa. Se renderiza en mono, como el resto de la metadata temporal. */
  readonly at: string;
  readonly body: string;
  readonly title: string;
}

export interface NavItem {
  readonly href: string;
  readonly label: string;
}

export interface Press {
  readonly date: string;
  readonly outlet: string;
  /** Solo la frase que refiere a Santiago. Nunca declaraciones de terceros. */
  readonly quote: string;
  readonly title: string;
  readonly url: string;
}

export interface Profile {
  readonly about: {
    readonly narrative: readonly string[];
    readonly principle: string;
    readonly principleSupport: readonly string[];
    readonly timeline: readonly Milestone[];
  };
  readonly certifications: readonly CertificationGroup[];
  readonly education: readonly Education[];
  readonly experience: readonly Experience[];
  readonly hero: {
    readonly availability: string;
    readonly eyebrow: string;
    readonly headline: string;
    readonly name: string;
    readonly location: string;
    readonly tagline: string;
  };
  readonly hobbies: readonly Hobby[];
  readonly languages: readonly SpokenLanguage[];
  readonly meta: {
    readonly description: string;
    readonly lang: Lang;
    readonly title: string;
  };
  readonly nav: readonly NavItem[];
  readonly projects: readonly Project[];
  readonly sections: Readonly<Record<SectionKey, string>>;
  readonly skills: readonly SkillGroup[];
  readonly testimonials: readonly Testimonial[];
  readonly ui: Readonly<Record<UiKey, string>>;
}

export interface Project {
  readonly description: string;
  /** Imagen a ancho completo dentro del case study. Evidencia, no decoración. */
  readonly image?: { readonly alt: string; readonly caption: string; readonly src: string };
  readonly name: string;
  readonly period: string;
  /** La nota de prensa vive DENTRO del case study, no en una sección aparte. */
  readonly press?: Press;
  readonly result?: string;
  /** Si existe, el proyecto tiene case study propio en /[lang]/proyectos/[slug]. */
  readonly slug?: string;
  readonly status: ProjectStatus;
  readonly tech: readonly string[];
  readonly url?: string;
}

export type ProjectStatus = 'archived' | 'live' | 'verifiable';

export type SectionKey =
  | 'about'
  | 'certifications'
  | 'contact'
  | 'experience'
  | 'hobbies'
  | 'projects'
  | 'skills'
  | 'testimonials';

export interface SkillGroup {
  readonly category: SkillCategory;
  readonly items: readonly string[];
  readonly label: string;
  readonly note?: string;
}

export type SkillCategory =
  | 'ai'
  | 'backend'
  | 'databases'
  | 'devops'
  | 'frontend'
  | 'languages'
  | 'practices';

export interface SpokenLanguage {
  readonly level: string;
  readonly name: string;
}

export interface Testimonial {
  readonly author: string;
  readonly quote: string;
  readonly relation: TestimonialRelation;
  readonly role: string;
  readonly url?: string;
}

export type TestimonialRelation = 'reported-to-santiago' | 'santiagos-lead';

export type UiKey =
  | 'caseStudyLink'
  | 'contactEmail'
  | 'contactIntro'
  | 'contactWhatsApp'
  | 'currentBadge'
  | 'photoCaption'
  | 'projectArchived'
  | 'relationLead'
  | 'relationReportedTo'
  | 'skipToContent'
  | 'themeToggle'
  | 'timelineTitle'
  | 'verifiableBadge';
