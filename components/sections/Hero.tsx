import type { CSSProperties } from 'react';
import { QuickFacts } from '@/components/sections/QuickFacts';
import { StateFlow } from '@/components/sections/StateFlow';
import { ReplayOnView } from '@/components/ui/ReplayOnView';
import type { SupportedLocale } from '@/lib/i18n';
import type { Profile } from '@/types/profile';

/**
 * Hero.
 *
 * **El `<h1>` es lo que hace, no cómo se llama** (Rev. 6). Un nombre en 56px arriba de
 * un cargo, un párrafo y dos botones es el esqueleto de cualquier portfolio de dev, y un
 * recruiter lo reconoce antes de leer una palabra. El nombre y el cargo siguen siendo lo
 * primero, en una línea; la frase grande es la tesis.
 *
 * **Después, la tesis demostrada:** el recorrido real de un trámite a todo el ancho, y al
 * llegar al final, el resultado. Abajo, la carátula con los datos, el extracto y los
 * botones, sellada.
 *
 * **Un solo momento de movimiento** (DISENO.md §5): el recorrido se dibuja y el resultado
 * aparece cuando termina. Es una secuencia, no dos animaciones: los retardos salen de
 * `--flow-last`. Se repite cada vez que se vuelve a verla (`ReplayOnView`); el sello de
 * la carátula cae cuando ella entra en pantalla.
 */
export function Hero({
  hero,
  lang,
  ui,
}: {
  hero: Profile['hero'];
  lang: SupportedLocale;
  ui: Profile['ui'];
}) {
  const sequence = { '--flow-last': hero.flow.steps.length - 1 } as CSSProperties;

  return (
    <header className="page pb-16 pt-12 md:pb-24 md:pt-20" id="top" style={sequence}>
      <p className="text-pretty text-muted">
        <span className="text-heading">{hero.name}</span>, {hero.headline}. {hero.location}.
      </p>

      <h1 className="display-hero mt-5 max-w-[21ch]">{hero.thesis}</h1>

      {/* El recorrido y su resultado se repiten juntos cada vez que se vuelve a ellos. */}
      <ReplayOnView className="mt-14 md:mt-20">
        <StateFlow flow={hero.flow} lang={lang} linkLabel={ui.caseStudyLink} wide />

        <p className="flow-after mt-14 grid gap-1 md:mt-16">
          <span className="h2 text-heading">{hero.outcome.value}</span>
          <span className="small">{hero.outcome.note}</span>
        </p>
      </ReplayOnView>

      <QuickFacts hero={hero} lang={lang} ui={ui} />
    </header>
  );
}
