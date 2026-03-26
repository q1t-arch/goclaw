/**
 * Resolve CSS custom properties to computed color strings for use in
 * Recharts/SVG where `var(--x)` does not work as fill/stroke value.
 *
 * Reads getComputedStyle(documentElement) once per call — cheap and
 * always reflects the active color scheme + brightness mode.
 */

export type ChartPalette = {
  chart1: string;
  chart2: string;
  chart3: string;
  chart4: string;
  chart5: string;
  destructive: string;
  border: string;
};

let _cached: ChartPalette | null = null;
let _cacheKey = "";

function readVar(style: CSSStyleDeclaration, name: string): string {
  return style.getPropertyValue(name).trim();
}

export function getChartColors(): ChartPalette {
  const root = document.documentElement;
  const key = root.className; // e.g. "default dark" or "neon light"
  if (_cached && _cacheKey === key) return _cached;

  const s = getComputedStyle(root);
  _cached = {
    chart1: readVar(s, "--chart-1"),
    chart2: readVar(s, "--chart-2"),
    chart3: readVar(s, "--chart-3"),
    chart4: readVar(s, "--chart-4"),
    chart5: readVar(s, "--chart-5"),
    destructive: readVar(s, "--destructive"),
    border: readVar(s, "--border"),
  };
  _cacheKey = key;
  return _cached;
}

/** Palette array for pie/donut charts — cycles through chart tokens. */
export function getChartPalette(): string[] {
  const c = getChartColors();
  return [c.chart1, c.chart2, c.chart3, c.chart4, c.chart5];
}
