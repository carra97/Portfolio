/**
 * Los tipos del contenido se derivan del esquema Zod (`lib/content/schema.ts`), que es
 * la fuente única. Este archivo queda como punto de importación estable para los
 * componentes: `@/types/profile` sigue siendo la ruta que se lee en un import, y si
 * mañana el esquema se parte en varios módulos, los componentes no se enteran.
 *
 * No declarar tipos acá. Se declaran en el esquema o no existen.
 */
export type {
  Certification,
  CertificationGroup,
  Education,
  Experience,
  Hobby,
  Lang,
  Milestone,
  PageMeta,
  Press,
  Profile,
  Project,
  ProjectStatus,
  QuickFact,
  SectionTitleKey,
  SkillCategory,
  SkillGroup,
  SpokenLanguage,
  Testimonial,
  TestimonialRelation,
  UiKey,
  UiStrings,
} from '@/lib/content/schema';
