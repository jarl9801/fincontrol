/**
 * NEXUS.OS — Alert
 *
 * Inline contextual message (NOT a toast — for that use <Toast/>).
 * Border-led, no fills, no shadows.
 */
import { CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';

const VARIANT = {
  ok:   { cls: 'nx-alert nx-alert-ok',   icon: CheckCircle2,  color: 'var(--color-ok)' },
  warn: { cls: 'nx-alert nx-alert-warn', icon: AlertTriangle, color: 'var(--color-warn)' },
  err:  { cls: 'nx-alert nx-alert-err',  icon: XCircle,       color: 'var(--color-err)' },
  info: { cls: 'nx-alert nx-alert-info', icon: Info,          color: 'var(--color-info)' },
};

const Alert = ({ variant = 'info', title, children, action, className = '' }) => {
  const v = VARIANT[variant] || VARIANT.info;
  const Icon = v.icon;
  return (
    <div className={`${v.cls} ${className}`}>
      <Icon size={16} style={{ color: v.color, flexShrink: 0, marginTop: 2 }} />
      <div className="flex-1">
        {title && <p className="label-mono" style={{ color: v.color, marginBottom: 4 }}>{title}</p>}
        <div className="text-[13px] leading-relaxed">{children}</div>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
};

export default Alert;
