/**
 * Interpolación de plantillas de UI: `"Recomendación {n} de {total}"`.
 *
 * Existe para que un string que lleva números no se arme concatenando en el componente.
 * Concatenar funciona en castellano y se rompe en cualquier idioma donde el orden de
 * los fragmentos sea otro — y el sitio es bilingüe por requerimiento. Una función de
 * seis líneas hoy evita reescribir los componentes cuando entre `en`.
 *
 * Deliberadamente tonta: sin pluralización ni formato de fecha. Cuando haga falta
 * alguna de las dos, la reemplaza `Intl`, no una versión más lista de esto.
 */
export function interpolate(template: string, values: Readonly<Record<string, number | string>>) {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = values[key];
    return value === undefined ? match : String(value);
  });
}
