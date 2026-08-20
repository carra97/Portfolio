import { ThemeToggle } from '@/components/ThemeToggle';
import type { Profile } from '@/types/profile';

/**
 * Navegación sticky con anclas. Los labels van en mono con tracking abierto — el mismo
 * tratamiento que los eyebrows de sección (DISENO.md §6), así la navegación lee como
 * metadata del documento y no como una barra de aplicación.
 *
 * Anclas y no rutas: es una sola página. Un router para siete secciones agregaría
 * navegación real, estados de carga y siete builds, a cambio de nada.
 *
 * El monograma "SC" en lugar del retrato: DISENO.md §7.1 es explícito en que la foto
 * de tres cuartos desaparece a 40px.
 */
export function Nav({ items, themeLabel }: { items: Profile['nav']; themeLabel: string }) {
  return (
    <div className="sticky top-0 z-40 border-b border-line bg-page/85 backdrop-blur-md">
      <nav
        aria-label="Navegación principal"
        className="mx-auto flex max-w-[1120px] items-center gap-6 px-6 py-3 md:px-10"
      >
        <a
          aria-label="Inicio"
          className="font-mono text-sm tracking-[0.12em] text-heading transition-colors duration-150 hover:text-accent"
          href="#top"
        >
          SC
        </a>

        {/* Scroll horizontal en mobile en lugar de menú hamburguesa: siete anclas
            entran deslizando y evita un componente de cliente con estado abierto. */}
        <ul className="flex flex-1 gap-5 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {items.map((item) => (
            <li key={item.href}>
              <a
                className="font-mono text-xs uppercase tracking-[0.12em] text-muted transition-colors duration-150 hover:text-heading"
                href={item.href}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        <ThemeToggle label={themeLabel} />
      </nav>
    </div>
  );
}
