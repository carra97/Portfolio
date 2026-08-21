import type { Profile } from '@/types/profile';

export function Skills({ groups }: { groups: Profile['skills'] }) {
  return (
    <dl className="space-y-10">
      {groups.map((group) => (
        <div key={group.category} className="grid gap-3 md:grid-cols-[200px_1fr] md:gap-8">
          <dt className="font-mono text-xs uppercase tracking-[0.12em] text-muted md:pt-1.5">
            {group.label}
          </dt>
          <dd>
            <ul className="flex flex-wrap gap-2">
              {group.items.map((item) => (
                <li
                  key={item}
                  className="rounded-md border border-line bg-surface px-2.5 py-1 text-sm"
                >
                  {item}
                </li>
              ))}
            </ul>
            {/* La salvedad de encuadre es tan parte del dato como el dato. */}
            {group.note && <p className="measure small mt-3 text-pretty">{group.note}</p>}
          </dd>
        </div>
      ))}
    </dl>
  );
}
