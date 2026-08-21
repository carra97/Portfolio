import type { ReactNode } from 'react';

import { AboutNarrative } from '@/components/sections/AboutNarrative';
import { Contact } from '@/components/sections/Contact';
import { Credentials } from '@/components/sections/Credentials';
import { CurrentRole } from '@/components/sections/CurrentRole';
import { Experience } from '@/components/sections/Experience';
import { FeaturedProjects } from '@/components/sections/FeaturedProjects';
import { Hobbies } from '@/components/sections/Hobbies';
import { Journey } from '@/components/sections/Journey';
import { Projects } from '@/components/sections/Projects';
import { Skills } from '@/components/sections/Skills';
import { Testimonials } from '@/components/sections/Testimonials';
import type { SupportedLocale } from '@/lib/i18n';
import type { Profile, SectionTitleKey } from '@/types/profile';

/**
 * Registro de secciones.
 *
 * ## El problema que resuelve
 *
 * El orden, los ids, la numeración ("01".."08") y las etiquetas del nav vivían en tres
 * lugares a la vez: el JSX de `page.tsx`, el array `nav` del JSON y el record
 * `sections`. Mover una sección eran tres ediciones coordinadas y una renumeración a
 * mano, y ninguna de las desincronizaciones posibles rompe el build: el síntoma era un
 * link del nav apuntando a algo que ya no existía.
 *
 * Ahora hay dos registros con una responsabilidad cada uno:
 * - **este**, que dice cómo se renderiza cada sección;
 * - **`lib/pages/registry.ts`**, que dice qué página muestra cuáles y en qué orden.
 *
 * Una sección no sabe en qué página vive, y una página no sabe cómo se dibuja una
 * sección. Mover una sección de página es editar un array de ids.
 *
 * ## Por qué registro y no factory
 *
 * Una factory sirve para *elegir una implementación* entre varias intercambiables —el
 * proveedor de LLM del chatbot, o el cargador genérico de `lib/content/loader.ts`—.
 * Acá no se elige nada: se enumera un conjunto fijo, conocido en compilación. Una
 * factory sería indirección que no absorbe ninguna variabilidad, justo la abstracción
 * prematura que el proyecto pide evitar.
 *
 * ## Por qué `render` y no un mapa de componentes
 *
 * Cada sección recibe props distintas. Un `Record<SectionId, ComponentType<Props>>`
 * obligaría a un tipo de props común —y con eso a castear en cada uso— o a un `any`.
 * Un closure sobre `SectionContext` deja el chequeo de tipos intacto en cada llamada.
 */

export type SectionId =
  | 'about'
  | 'contact'
  | 'current-role'
  | 'education'
  | 'experience'
  | 'featured-projects'
  | 'hobbies'
  | 'journey'
  | 'projects'
  | 'recommendations'
  | 'stack';

export interface SectionContext {
  readonly lang: SupportedLocale;
  readonly profile: Profile;
}

export interface SectionDefinition {
  /** Id del DOM y ancla dentro de la página. Estable entre idiomas a propósito. */
  readonly id: SectionId;
  /**
   * Visibilidad según el contenido. Sin testimonios cargados no se renderiza un
   * encabezado vacío: la sección directamente no existe en esa página.
   */
  readonly isAvailable: (profile: Profile) => boolean;
  readonly render: (context: SectionContext) => ReactNode;
  readonly titleKey: SectionTitleKey;
}

const always = () => true;

const SECTIONS: Readonly<Record<SectionId, SectionDefinition>> = {
  about: {
    id: 'about',
    isAvailable: always,
    render: ({ profile }) => (
      <AboutNarrative
        about={profile.about}
        caption={profile.ui.photoCaption}
        photoAlt={profile.ui.photoAlt}
      />
    ),
    titleKey: 'about',
  },
  contact: {
    id: 'contact',
    isAvailable: always,
    render: ({ profile }) => (
      <Contact
        emailLabel={profile.ui.contactEmail}
        intro={profile.ui.contactIntro}
        subject={`${profile.ui.heroContactCta} — ${profile.hero.name}`}
        whatsappLabel={profile.ui.contactWhatsApp}
      />
    ),
    titleKey: 'contact',
  },
  'current-role': {
    id: 'current-role',
    isAvailable: (profile) => profile.experience.some((job) => job.current),
    render: ({ lang, profile }) => (
      <CurrentRole items={profile.experience} lang={lang} ui={profile.ui} />
    ),
    titleKey: 'currentRole',
  },
  education: {
    id: 'education',
    isAvailable: (profile) => profile.certifications.length > 0 || profile.education.length > 0,
    render: ({ profile }) => (
      <Credentials
        certifications={profile.certifications}
        education={profile.education}
        languages={profile.languages}
        ui={profile.ui}
      />
    ),
    titleKey: 'certifications',
  },
  experience: {
    id: 'experience',
    isAvailable: (profile) => profile.experience.length > 0,
    render: ({ profile }) => (
      <Experience currentBadge={profile.ui.currentBadge} items={profile.experience} />
    ),
    titleKey: 'experience',
  },
  'featured-projects': {
    id: 'featured-projects',
    isAvailable: (profile) => profile.projects.some((project) => Boolean(project.slug)),
    render: ({ lang, profile }) => (
      <FeaturedProjects
        items={profile.projects}
        labels={profile.carousels.projects}
        lang={lang}
        ui={profile.ui}
      />
    ),
    titleKey: 'featuredProjects',
  },
  hobbies: {
    id: 'hobbies',
    isAvailable: (profile) => profile.hobbies.length > 0,
    render: ({ profile }) => (
      <Hobbies
        items={profile.hobbies}
        roverAlt={profile.ui.roverAlt}
        roverCaption={profile.ui.roverCaption}
      />
    ),
    titleKey: 'hobbies',
  },
  journey: {
    id: 'journey',
    isAvailable: (profile) => profile.about.timeline.length > 0,
    render: ({ profile }) => <Journey timeline={profile.about.timeline} />,
    titleKey: 'journey',
  },
  projects: {
    id: 'projects',
    isAvailable: (profile) => profile.projects.length > 0,
    render: ({ lang, profile }) => <Projects items={profile.projects} lang={lang} ui={profile.ui} />,
    titleKey: 'projects',
  },
  recommendations: {
    id: 'recommendations',
    isAvailable: (profile) => profile.testimonials.length > 0,
    render: ({ profile }) => (
      <Testimonials
        carousel={profile.carousels.testimonials}
        items={profile.testimonials}
        labels={{
          'reported-to-santiago': profile.ui.relationReportedTo,
          'santiagos-lead': profile.ui.relationLead,
        }}
        ui={profile.ui}
      />
    ),
    titleKey: 'testimonials',
  },
  stack: {
    id: 'stack',
    isAvailable: (profile) => profile.skills.length > 0,
    render: ({ profile }) => <Skills groups={profile.skills} />,
    titleKey: 'skills',
  },
};

/** Secciones visibles de una lista de ids, en ese orden. La numeración sale del índice. */
export function resolveSections(
  ids: readonly SectionId[],
  profile: Profile,
): readonly SectionDefinition[] {
  return ids.map((id) => SECTIONS[id]).filter((section) => section.isAvailable(profile));
}
