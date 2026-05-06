/**
 * NEXUS.OS — KPI + KPIGrid
 *
 * The signature Nexus pattern: a row of metric cards inside a single bordered
 * container, separated by `gap-px` (which renders as 1px divider lines on the
 * surface color underneath). No individual borders, no shadows.
 *
 * Use <KPIGrid cols={N}> as the wrapper; put <KPI> children inside.
 *
 * Tone hints color the value:
 *   default → text-primary
 *   ok      → success
 *   warn    → warning
 *   err     → accent (error)
 *   info    → info
 */
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

const TONE = {
  default: 'var(--color-fg-1)',
  ok:      'var(--color-ok)',
  warn:    'var(--color-warn)',
  err:     'var(--color-err)',
  info:    'var(--color-info)',
};

export const KPIGrid = ({ cols = 4, children, className = '' }) => {
  const colCls = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-3',
    4: 'grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-2 lg:grid-cols-5',
  }[cols] || 'grid-cols-2 lg:grid-cols-4';

  return (
    <div
      className={`grid ${colCls} gap-px border border-[var(--color-line)] rounded-md overflow-hidden bg-[var(--color-line)] ${className}`}
    >
      {children}
    </div>
  );
};

export const KPI = ({
  label,
  value,
  meta,
  delta,
  trend,
  tone = 'default',
  size = 'md',
  icon: Icon,
  onClick,
  className = '',
}) => {
  const valueColor = TONE[tone] || TONE.default;
  const isClickable = typeof onClick === 'function';

  const valueSize = size === 'lg'
    ? 'text-[40px] leading-[1]'
    : size === 'sm'
      ? 'text-[18px]'
      : 'text-[22px]';

  const Root = isClickable ? 'button' : 'div';

  return (
    <Root
      type={isClickable ? 'button' : undefined}
      onClick={onClick}
      className={`bg-[var(--color-bg-1)] px-5 py-4 ${
        isClickable ? 'w-full text-left cursor-pointer hover:bg-[var(--color-bg-2)] transition-colors' : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="label-mono text-[var(--color-fg-3)]">{label}</p>
        {Icon && <Icon size={14} className="text-[var(--color-fg-4)] flex-shrink-0 mt-0.5" />}
      </div>
      <p
        className={`font-mono ${valueSize} tabular-nums tracking-tight mt-2`}
        style={{ color: valueColor }}
      >
        {value}
      </p>
      {(meta || delta) && (
        <div className="flex items-center gap-2 mt-2">
          {delta && (
            <span
              className="font-mono text-[11px] flex items-center gap-1"
              style={{ color: trend === 'down' ? 'var(--color-err)' : 'var(--color-ok)' }}
            >
              {trend === 'down' ? <ArrowDownRight size={11} /> : <ArrowUpRight size={11} />}
              {delta}
            </span>
          )}
          {meta && <p className="font-mono text-[11px] text-[var(--color-fg-4)]">{meta}</p>}
        </div>
      )}
    </Root>
  );
};

export default KPI;
