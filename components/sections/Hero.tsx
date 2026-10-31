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
 * **Un solo momento de movimiento** (DISENO.md §5), en dos tiempos: al entrar, la
 * presentación y la tesis suben, y cuando la tesis asienta el recorrido se dibuja. La
 * entrada corre una vez; el recorrido se repite cada vez que se vuelve a verlo
 * (`ReplayOnView`). El resultado está quieto desde el principio: si aparecía al final del
 * recorrido, se leía como un bloque que salta de la nada. El sello de la carátula cae
 * cuando ella entra en pantalla.
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
  return (
    <header className="page pb-16 pt-12 md:pb-24 md:pt-20" id="top">
      <p className="rise text-pretty text-muted">
        <span className="text-heading">{hero.name}</span>, {hero.headline}. {hero.location}.
      </p>

      {/* Más lenta que la presentación: es texto grande y se lee mientras sube. */}
      <h1
        className="display-hero rise mt-5 max-w-[21ch]"
        style={{ animationDelay: '120ms', animationDuration: '700ms' }}
      >
        {hero.thesis}
      </h1>

      <ReplayOnView className="mt-14 md:mt-20">
        <StateFlow flow={hero.flow} lang={lang} linkLabel={ui.caseStudyLink} wide />
      </ReplayOnView>

      <p className="mt-14 grid gap-1 md:mt-16">
        <span className="h2 text-heading">{hero.outcome.value}</span>
        <span className="small">{hero.outcome.note}</span>
      </p>

      <QuickFacts hero={hero} lang={lang} ui={ui} />
    </header>
  );
}
