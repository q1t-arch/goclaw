import { useMemo } from "react";
import { useUiStore } from "@/stores/use-ui-store";
import { getChartColors, getChartPalette, type ChartPalette } from "@/lib/chart-colors";

export type { ChartPalette };

/**
 * Returns resolved chart colors that update when theme/colorScheme changes.
 * Subscribes to useUiStore so React triggers re-render on switch.
 */
export function useChartColors() {
  const theme = useUiStore((s) => s.theme);
  const colorScheme = useUiStore((s) => s.colorScheme);

  return useMemo(() => {
    // Dependencies ensure recalc on theme change
    void theme;
    void colorScheme;
    return getChartColors();
  }, [theme, colorScheme]);
}

/** Palette array for pie/donut charts. */
export function useChartPalette(): string[] {
  const theme = useUiStore((s) => s.theme);
  const colorScheme = useUiStore((s) => s.colorScheme);

  return useMemo(() => {
    void theme;
    void colorScheme;
    return getChartPalette();
  }, [theme, colorScheme]);
}
