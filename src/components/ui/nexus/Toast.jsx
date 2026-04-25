/**
 * NEXUS.OS — Toast
 *
 * Floating notification, top-right. Auto-dismisses after `duration` ms (default 3000).
 * Pair with a tiny manager hook (`useToast`) or call directly via portal.
 *
 * <Toast variant="ok" onDismiss={() => setToast(null)}>
 *   Abono registrado
 * </Toast>
 */
import { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, X } from 'lucide-react';

const VARIANT = {
  ok:   { icon: CheckCircle2,  color: 'var(--success)' },
  warn: { icon: AlertTriangle, color: 'var(--warning)' },
  err:  { icon: XCircle,       color: 'var(--error)' },
};

const Toast = ({ variant = 'ok', children, duration = 3000, onDismiss }) => {
  useEffect(() => {
    if (!duration || !onDismiss) return;
    const t = setTimeout(onDismiss, duration);
    return () => clearTimeout(t);
  }, [duration, onDismiss]);

  const v = VARIANT[variant] || VARIANT.ok;
  const Icon = v.icon;

  return (
    <div
      className="fixed top-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-md border bg-[var(--surface)] animate-fadeIn"
      style={{ borderColor: v.color }}
      role="status"
    >
      <Icon size={16} style={{ color: v.color, flexShrink: 0 }} />
      <span className="text-[13px] text-[var(--text-primary)]">{children}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="ml-2 text-[var(--text-disabled)] hover:text-[var(--text-primary)] transition-colors"
          aria-label="Cerrar"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
};

export default Toast;
