/**
 * Nothing Design System — Recharts Theme
 * Monochrome palette for all chart components.
 * Uses CSS variable values for consistency with the design system.
 */

const style = typeof getComputedStyle !== 'undefined' && document?.documentElement
  ? getComputedStyle(document.documentElement)
  : null;

const v = (name, fallback) =>
  style?.getPropertyValue(name)?.trim() || fallback;

export const CHART_THEME = {
  grid: v('--border', '#1F1F1F'),
  axis: v('--text-disabled', '#555555'),
  axisFont: { fontFamily: "'Space Mono', monospace", fontSize: 11, fill: v('--text-secondary', '#888888') },
  tooltip: {
    bg: v('--surface', '#1C1C1C'),
    border: v('--border-visible', '#2E2E2E'),
    text: v('--text-primary', '#D4D4D4'),
    label: v('--text-secondary', '#888888'),
  },
  // Monochrome bar/area fills — ordered by brightness
  bars: [
    v('--text-primary', '#D4D4D4'),
    v('--text-secondary', '#888888'),
    v('--text-disabled', '#555555'),
    v('--text-tertiary', '#444444'),
    v('--border-visible', '#2E2E2E'),
  ],
  // Line chart strokes
  lines: [
    v('--text-primary', '#D4D4D4'),
    v('--text-disabled', '#555555'),
    v('--text-secondary', '#888888'),
    v('--text-tertiary', '#444444'),
  ],
  // Status-specific (use sparingly)
  accent: v('--accent', '#5B9BF6'),
  negative: v('--negative', '#D71921'),
  success: v('--success', '#4A9E5C'),
  warning: v('--warning', '#D4A843'),
  neutral: v('--text-secondary', '#888888'),
};

// Replaces the old COLORS array from config.js for chart usage
export const CHART_COLORS = CHART_THEME.bars;
