/**
 * NEXUS.OS — Badge
 *
 * Tiny mono uppercase pill for status, tags, counters.
 * Variants map to the semantic palette.
 */
const VARIANT = {
  ok:      'nx-badge nx-badge-ok',
  warn:    'nx-badge nx-badge-warn',
  err:     'nx-badge nx-badge-err',
  info:    'nx-badge nx-badge-info',
  neutral: 'nx-badge nx-badge-neutral',
};

const Badge = ({ variant = 'neutral', dot = false, children, className = '', ...rest }) => (
  <span
    className={`${VARIANT[variant] || VARIANT.neutral} ${dot ? 'nx-badge-dot' : ''} ${className}`}
    {...rest}
  >
    {children}
  </span>
);

export default Badge;
