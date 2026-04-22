/**
 * NEXUS.OS — Recharts Theme
 * Dark-first palette using Nexus tokens with a restrained accent usage.
 */

const style = typeof getComputedStyle !== 'undefined' && document?.documentElement
  ? getComputedStyle(document.documentElement)
  : null;

const v = (name, fallback) =>
  style?.getPropertyValue(name)?.trim() || fallback;

export const CHART_THEME = {
  grid: v('--color-line', '#222630'),
  axis: v('--color-fg-4', '#4A4C50'),
  axisFont: {
    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
    fontSize: 11,
    fill: v('--color-fg-3', '#7B7D7A'),
  },
  tooltip: {
    bg: v('--color-bg-2', '#161920'),
    border: v('--color-line-s', '#2E3440'),
    text: v('--color-fg-1', '#F5F3EE'),
    label: v('--color-fg-3', '#7B7D7A'),
  },
  // Series fills — accent leads, mono tones follow.
  bars: [
    v('--color-accent', '#FF4D2E'),
    v('--color-fg-1', '#F5F3EE'),
    v('--color-fg-2', '#B9BAB4'),
    v('--color-fg-3', '#7B7D7A'),
    v('--color-fg-4', '#4A4C50'),
    v('--color-info', '#6BA6FF'),
  ],
  // Line chart strokes
  lines: [
    v('--color-accent', '#FF4D2E'),
    v('--color-fg-1', '#F5F3EE'),
    v('--color-fg-3', '#7B7D7A'),
    v('--color-info', '#6BA6FF'),
  ],
  // Status-specific (use sparingly — only for explicit semantic meaning)
  accent: v('--color-accent', '#FF4D2E'),
  negative: v('--color-err', '#FF4D2E'),
  success: v('--color-ok', '#4ADE80'),
  warning: v('--color-warn', '#FFB020'),
  info: v('--color-info', '#6BA6FF'),
  neutral: v('--color-fg-3', '#7B7D7A'),
};

// Replaces the old COLORS array from config.js for chart usage
export const CHART_COLORS = CHART_THEME.bars;
