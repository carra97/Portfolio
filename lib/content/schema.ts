import { z } from 'zod';

/**
 * Esquema del contenido — **fuente única** de la forma de los datos.
 *
 * Antes había dos: las interfaces en `types/` y el JSON en `content/`, unidas por un
 * `as unknown as Profile`. Ese doble cast no valida nada: le dice al compilador
 * "confiá en mí" sobre un archivo que se edita a mano. Un `narrative` que pasara a ser
 * string en vez de array compilaba igual y explotaba en runtime, en producción,
 * renderizando basura.
 *
 * Ahora el esquema Zod es lo único que se declara y los tipos se derivan con
 * `z.infer`. El parseo corre **una vez, en build**, porque todas las páginas son
 * estáticas: si el JSON deja de cumplir el contrato, falla `npm run build` con la
 * ruta exacta del campo. Costo en runtime: cero.
 *
 * Convención del proyecto: claves en orden alfabético.
 */

/* ── Primitivas ─────────────────────────────────────────────────────────────── */

/** Texto que se renderiza como contenido: nunca vacío, para no dejar huecos mudos. */
const text = z.string().min(1);

const url = z.string().url();

/* ── Piezas ─────────────────────────────────────────────────────────────────── */

export const langSchema = z.enum(['en', 'es']);

/**
 * Estado del proyecto. Gobierna el render, no es decorativo.
 *
 * - `archived`: el proyecto está cerrado y **no se enlaza**. Regla del dossier que hace
 *   cumplir el compilador y el render, no la memoria de quien edita el JSON.
 * - `internal`: sistema interno de un organismo. No hay repo ni demo que mostrar, pero
 *   sigue en uso. Se separó de `archived` porque decirle "proyecto cerrado" a un sistema
 *   de gobierno que corre todos los días es falso, y para un recruiter es peor que falso:
 *   suena a proyecto muerto.
 * - `live`: tiene URL pública.
 * - `verifiable`: existe evidencia pública de terceros (prensa, acto oficial).
 */
export const projectStatusSchema = z.enum(['archived', 'internal', 'live', 'verifiable']);

/**
 * La relación de quien recomienda es la mitad del valor del testimonio: que dos
 * personas a las que lideró avalen su liderazgo dice algo que un par no dice.
 * Por eso es obligatoria, no un adorno opcional.
 */
export const testimonialRelationSchema = z.enum(['reported-to-santiago', 'santiagos-lead']);

export const skillCategorySchema = z.enum([
  'ai',
  'backend',
  'databases',
  'devops',
  'frontend',
  'languages',
  'practices',
]);

/**
 * Un certificado.
 *
 * Dejó de ser un `string` porque una certificación sin forma de comprobarla es una
 * afirmación, y un revisor escéptico la descuenta. Las dos formas de comprobarla no son
 * equivalentes y por eso son campos distintos:
 *
 * - `verifyUrl` es una página del emisor. Es la prueba fuerte: la sirve un tercero y no
 *   se puede falsificar desde acá. Cuando existe, gana.
 * - `image` es el certificado escaneado, servido por este sitio. Es prueba débil —la
 *   emitimos nosotros— pero es lo único disponible cuando el emisor no publica una
 *   página de verificación, que es el caso de los nueve de Anthropic y el de AWS.
 *
 * Los dos son opcionales: un certificado sin ninguno se sigue listando, simplemente no
 * ofrece nada para hacer click. Es preferible a inventarle un enlace.
 */
export const certificationSchema = z
  .object({
    /** Ruta bajo `/certificados`. Se abre en un diálogo modal. */
    image: text.optional(),
    name: text,
    /** Página de verificación del emisor. */
    verifyUrl: url.optional(),
    year: text.optional(),
  })
  .readonly();

export const certificationGroupSchema = z
  .object({
    /** Marco que convierte una lista de badges en una ruta de formación. */
    framing: text.optional(),
    issuer: text,
    items: z.array(certificationSchema).min(1).readonly(),
    year: text.optional(),
  })
  .readonly();

export const educationSchema = z
  .object({
    institution: text,
    note: text.optional(),
    title: text,
    year: text.optional(),
  })
  .readonly();

export const experienceSchema = z
  .object({
    achievements: z.array(text).min(1).readonly(),
    company: text,
    context: text.optional(),
    current: z.boolean(),
    location: text,
    period: text,
    role: text,
    stack: z.array(text).min(1).readonly(),
  })
  .readonly();

export const hobbySchema = z
  .object({
    /** Una línea con contenido real. Un hobby listado no dice nada; descripto, sí. */
    detail: text,
    /** 'lead' se destaca con foto; el resto va compacto. Nada de grilla de íconos. */
    emphasis: z.enum(['compact', 'lead']),
    name: text,
  })
  .readonly();

export const milestoneSchema = z
  .object({
    /** Año o etapa. Se renderiza en mono, como el resto de la metadata temporal. */
    at: text,
    body: text,
    title: text,
  })
  .readonly();

export const pressSchema = z
  .object({
    date: text,
    outlet: text,
    /** Solo la frase que refiere a Santiago. Nunca declaraciones de terceros. */
    quote: text,
    title: text,
    url,
  })
  .readonly();

export const projectSchema = z
  .object({
    description: text,
    image: z
      .object({ alt: text, caption: text, src: text })
      .readonly()
      .optional(),
    name: text,
    period: text,
    /** La nota de prensa vive DENTRO del case study, no en una sección aparte. */
    press: pressSchema.optional(),
    result: text.optional(),
    /** Si existe, el proyecto tiene case study propio. */
    slug: text.optional(),
    status: projectStatusSchema,
    tech: z.array(text).min(1).readonly(),
    url: url.optional(),
  })
  .readonly();

/**
 * Dato de escaneo rápido. Existe por una razón medible: un recruiter decide en
 * segundos, y hasta ahora los datos que busca primero —seniority, stack, modalidad,
 * idiomas— estaban repartidos entre cuatro secciones separadas por 900 palabras.
 * Acá van juntos, arriba de todo, sin scroll.
 */
export const quickFactSchema = z
  .object({
    label: text,
    value: text,
  })
  .readonly();

export const skillGroupSchema = z
  .object({
    category: skillCategorySchema,
    items: z.array(text).min(1).readonly(),
    label: text,
    /** La salvedad de encuadre es tan parte del dato como el dato. */
    note: text.optional(),
  })
  .readonly();

export const spokenLanguageSchema = z.object({ level: text, name: text }).readonly();

export const testimonialSchema = z
  .object({
    author: text,
    quote: text,
    relation: testimonialRelationSchema,
    role: text,
    url: url.optional(),
  })
  .readonly();

/**
 * Etiquetas de un carrusel concreto.
 *
 * Un objeto por instancia y no claves sueltas con prefijo: al aparecer el segundo
 * carrusel, el patrón plano obligaba a `carouselNextProject`, `carouselNextTestimonial`…
 * — cuatro claves nuevas por cada carrusel, y ninguna garantía de que estén las cuatro.
 * Así el esquema exige el juego completo o rompe el build.
 *
 * Los nombres accesibles son específicos a propósito: "Siguiente recomendación" le dice a
 * quien navega a ciegas qué está por aparecer; "Siguiente" no dice nada.
 */
export const carouselLabelsSchema = z
  .object({
    /** Nombre accesible de la región. */
    group: text,
    next: text,
    previous: text,
    /** Plantilla con {n} y {total}. Ver `lib/format.ts`. */
    slidePosition: text,
  })
  .readonly();

/**
 * Metadata de una página. Una entrada por ruta pública.
 *
 * Cuatro campos y no uno porque cumplen funciones distintas y se leen en lugares
 * distintos: `title` es el `<title>` (con el nombre, para que se entienda fuera de
 * contexto), `heading` el `<h1>` (sin el nombre, ya se sabe de quién es el sitio),
 * `navLabel` la etiqueta corta del nav, y `description` sirve a la vez de meta
 * description y de bajada visible. Reusar uno solo obliga a elegir entre un `<h1>`
 * redundante o un `<title>` incomprensible en una pestaña.
 */
export const pageMetaSchema = z
  .object({ description: text, heading: text, navLabel: text, title: text })
  .readonly();

/* ── Perfil ─────────────────────────────────────────────────────────────────── */

export const sectionTitlesSchema = z
  .object({
    about: text,
    certifications: text,
    contact: text,
    currentRole: text,
    experience: text,
    featuredProjects: text,
    hobbies: text,
    journey: text,
    projects: text,
    skills: text,
    testimonials: text,
  })
  .readonly();

/**
 * Strings de interfaz. Objeto explícito y no `Record<string, string>`: así falta una
 * clave y rompe el build, en vez de renderizar `undefined` en un botón. Todo string
 * visible vive acá — no hay literales en castellano dentro de los componentes, que es
 * la precondición para que el locale `en` sea agregar un JSON y nada más.
 */
export const uiStringsSchema = z
  .object({
    aboutCta: text,
    aboutTeaserEyebrow: text,
    breadcrumbLabel: text,
    /** `aria-roledescription` de la región. Se traduce como cualquier otro string. */
    carouselRole: text,
    /** `aria-roledescription` de cada tarjeta. */
    carouselSlideRole: text,
    /** Botón que abre el certificado. */
    certificateOpen: text,
    certificateClose: text,
    certificateFullSize: text,
    /** Enlace a la página de verificación del emisor. */
    certificateVerify: text,
    /** Strings del widget de chat. Se renderizan solo si `chatEnabled`. */
    chatClose: text,
    chatDisclaimer: text,
    chatError: text,
    chatIntro: text,
    chatLauncher: text,
    chatPlaceholder: text,
    chatReady: text,
    chatRetry: text,
    chatSend: text,
    chatThinking: text,
    chatTitle: text,
    caseStudyContactCta: text,
    caseStudyLink: text,
    contactEmail: text,
    contactIntro: text,
    contactWhatsApp: text,
    currentBadge: text,
    footerAvailabilityLabel: text,
    footerContactLabel: text,
    footerCvLink: text,
    footerDownloadLabel: text,
    footerRepoLink: text,
    heroContactCta: text,
    navLabel: text,
    photoAlt: text,
    photoCaption: text,
    /** Encuadre de la cita de prensa dentro del proyecto. */
    pressEyebrow: text,
    /** Frase que precede a la cita textual. La cita se renderiza aparte, en `<em>`. */
    pressIntro: text,
    projectArchived: text,
    projectInternal: text,
    quickFactsLabel: text,
    relationLead: text,
    relationReportedTo: text,
    resumeCta: text,
    roverAlt: text,
    roverCaption: text,
    skipToContent: text,
    themeToggle: text,
    verifiableBadge: text,
    viewExperience: text,
    viewProjects: text,
  })
  .readonly();

export const profileSchema = z
  .object({
    about: z
      .object({
        narrative: z.array(text).min(1).readonly(),
        principle: text,
        principleSupport: z.array(text).readonly(),
        timeline: z.array(milestoneSchema).min(1).readonly(),
      })
      .readonly(),
    /** Un juego de etiquetas por carrusel del sitio. */
    carousels: z
      .object({ projects: carouselLabelsSchema, testimonials: carouselLabelsSchema })
      .readonly(),
    /** Encabezados fijos de la plantilla de case study. */
    caseStudyLabels: z
      .object({
        architecture: text,
        constraints: text,
        decisions: text,
        outcome: text,
        problem: text,
        retrospective: text,
        tradeoff: text,
      })
      .readonly(),
    certifications: z.array(certificationGroupSchema).readonly(),
    education: z.array(educationSchema).readonly(),
    experience: z.array(experienceSchema).min(1).readonly(),
    hero: z
      .object({
        availability: text,
        eyebrow: text,
        headline: text,
        location: text,
        name: text,
        /** Datos de escaneo rápido, en el orden en que se muestran. */
        quickFacts: z.array(quickFactSchema).min(1).readonly(),
        /**
         * Ruta del CV en PDF. Opcional a propósito: mientras el archivo no exista, el
         * botón no se renderiza. Mismo criterio que `lib/env.ts` con el teléfono —
         * ausencia = degradación prevista; presencia inválida = error ruidoso.
         */
        resumeUrl: text.optional(),
        tagline: text,
      })
      .readonly(),
    hobbies: z.array(hobbySchema).readonly(),
    languages: z.array(spokenLanguageSchema).readonly(),
    meta: z.object({ lang: langSchema }).readonly(),
    /** Una entrada por página del registro de rutas. */
    pages: z
      .object({
        about: pageMetaSchema,
        contact: pageMetaSchema,
        education: pageMetaSchema,
        experience: pageMetaSchema,
        hobbies: pageMetaSchema,
        home: pageMetaSchema,
        projects: pageMetaSchema,
      })
      .readonly(),
    projects: z.array(projectSchema).min(1).readonly(),
    sections: sectionTitlesSchema,
    skills: z.array(skillGroupSchema).readonly(),
    testimonials: z.array(testimonialSchema).readonly(),
    ui: uiStringsSchema,
  })
  .readonly();

/* ── Case study ─────────────────────────────────────────────────────────────── */

export const decisionSchema = z
  .object({
    rationale: text,
    title: text,
    /** Qué se resignó. Sin esto es una lista de tecnologías, no una decisión. */
    tradeoff: text,
  })
  .readonly();

export const metricSchema = z
  .object({ label: text, note: text.optional(), value: text })
  .readonly();

/**
 * `decisions` y `retrospective` son requeridos: un proyecto sin decisiones explicadas
 * y sin autocrítica no justifica una página propia — va como tarjeta en el hub.
 * El esquema hace cumplir esa vara.
 */
export const caseStudySchema = z
  .object({
    architecture: text,
    /** Qué limitó las decisiones: presupuesto, stack heredado, política, tiempos. */
    constraints: z.array(text).min(1).readonly(),
    context: text,
    decisions: z.array(decisionSchema).min(1).readonly(),
    diagram: text.optional(),
    lang: langSchema,
    metrics: z.array(metricSchema).readonly().optional(),
    outcome: z.array(text).min(1).readonly(),
    problem: z.array(text).min(1).readonly(),
    /** Qué haría distinto hoy. Un semi-senior cuenta qué hizo; un senior, qué cambiaría. */
    retrospective: z.array(text).min(1).readonly(),
    slug: text,
    summary: text,
    tech: z.array(text).min(1).readonly(),
    title: text,
  })
  .readonly();

export const caseStudiesSchema = z.array(caseStudySchema).readonly();

/* ── Tipos derivados ────────────────────────────────────────────────────────── */

export type CaseStudy = z.infer<typeof caseStudySchema>;
export type Certification = z.infer<typeof certificationSchema>;
export type CertificationGroup = z.infer<typeof certificationGroupSchema>;
export type Decision = z.infer<typeof decisionSchema>;
export type Education = z.infer<typeof educationSchema>;
export type Experience = z.infer<typeof experienceSchema>;
export type Hobby = z.infer<typeof hobbySchema>;
export type Lang = z.infer<typeof langSchema>;
export type Metric = z.infer<typeof metricSchema>;
export type Milestone = z.infer<typeof milestoneSchema>;
export type PageMeta = z.infer<typeof pageMetaSchema>;
export type Press = z.infer<typeof pressSchema>;
export type Profile = z.infer<typeof profileSchema>;
export type Project = z.infer<typeof projectSchema>;
export type ProjectStatus = z.infer<typeof projectStatusSchema>;
export type QuickFact = z.infer<typeof quickFactSchema>;
export type SectionTitleKey = keyof z.infer<typeof sectionTitlesSchema>;
export type SkillCategory = z.infer<typeof skillCategorySchema>;
export type SkillGroup = z.infer<typeof skillGroupSchema>;
export type SpokenLanguage = z.infer<typeof spokenLanguageSchema>;
export type Testimonial = z.infer<typeof testimonialSchema>;
export type TestimonialRelation = z.infer<typeof testimonialRelationSchema>;
export type UiKey = keyof z.infer<typeof uiStringsSchema>;
export type CarouselLabels = z.infer<typeof carouselLabelsSchema>;
export type UiStrings = z.infer<typeof uiStringsSchema>;
