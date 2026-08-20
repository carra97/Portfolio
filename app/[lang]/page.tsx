import { notFound } from 'next/navigation';

import { About } from '@/components/About';
import { Contact } from '@/components/Contact';
import { Credentials } from '@/components/Credentials';
import { Experience } from '@/components/Experience';
import { Hero } from '@/components/Hero';
import { Hobbies } from '@/components/Hobbies';
import { JsonLd } from '@/components/JsonLd';
import { Nav } from '@/components/Nav';
import { Projects } from '@/components/Projects';
import { Section } from '@/components/Section';
import { Skills } from '@/components/Skills';
import { Testimonials } from '@/components/Testimonials';
import { getProfile } from '@/lib/content';
import { isSupportedLocale } from '@/lib/i18n';

export default async function ProfilePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isSupportedLocale(lang)) notFound();

  const profile = getProfile(lang);
  const { hero, sections, ui } = profile;

  return (
    <>
      <JsonLd profile={profile} />
      <Nav items={profile.nav} themeLabel={ui.themeToggle} />

      <Hero hero={hero} />

      <main id="contenido">
        <Section eyebrow="01" id="sobre-mi" title={sections.about}>
          <About about={profile.about} caption={ui.photoCaption} timelineTitle={ui.timelineTitle} />
        </Section>

        <Section eyebrow="02" id="experiencia" title={sections.experience}>
          <Experience currentBadge={ui.currentBadge} items={profile.experience} />
        </Section>

        <Section eyebrow="03" id="proyectos" title={sections.projects}>
          <Projects
            archivedLabel={ui.projectArchived}
            caseStudyLabel={ui.caseStudyLink}
            items={profile.projects}
            lang={lang}
            verifiableLabel={ui.verifiableBadge}
          />
        </Section>

        <Section eyebrow="04" id="stack" title={sections.skills}>
          <Skills groups={profile.skills} />
        </Section>

        <Section eyebrow="05" id="recomendaciones" title={sections.testimonials}>
          <Testimonials
            items={profile.testimonials}
            labels={{
              'reported-to-santiago': ui.relationReportedTo,
              'santiagos-lead': ui.relationLead,
            }}
          />
        </Section>

        <Section eyebrow="06" id="formacion" title={sections.certifications}>
          <Credentials
            certifications={profile.certifications}
            education={profile.education}
            languages={profile.languages}
          />
        </Section>

        <Section eyebrow="07" id="hobbies" title={sections.hobbies}>
          <Hobbies items={profile.hobbies} />
        </Section>

        <Section eyebrow="08" id="contacto" title={sections.contact}>
          <Contact
            emailLabel={ui.contactEmail}
            intro={ui.contactIntro}
            subject={`Contacto desde el portfolio — ${hero.name}`}
            whatsappLabel={ui.contactWhatsApp}
          />
        </Section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-between gap-4 px-6 py-10 md:px-10">
          <p className="small">
            © {new Date().getFullYear()} {hero.name}
          </p>
          <p className="font-mono text-xs tracking-[0.12em] text-muted">
            Next.js · TypeScript · Tailwind
          </p>
        </div>
      </footer>
    </>
  );
}
