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
  ok:   { icon: CheckCircle2,  color: 'var(--color-ok)' },
  warn: { icon: AlertTriangle, color: 'var(--color-warn)' },
  err:  { icon: XCircle,       color: 'var(--color-err)' },
};

const Toast = ({ variant = 'ok', children, duration = 3000, onDismiss }) => {
  useEffect(() => {
    if (!duration || !onDismiss) return;
    const t = setTimeout(onDismiss, duration);
    return () => clearTimeout(t);
  }, [duration, onDismiss]);

  const v = VARIANT[variant] || VARIANT.ok;
  const Icon = v.icon;
  const isError = variant === 'err';

  return (
    <div
      className="fixed left-4 right-4 top-4 z-[100] flex items-center gap-3 rounded-md border bg-[var(--color-bg-1)] px-4 py-3 animate-fadeIn sm:left-auto sm:right-6 sm:top-6 sm:max-w-[420px]"
      style={{ borderColor: v.color }}
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
    >
      <Icon size={16} style={{ color: v.color, flexShrink: 0 }} />
      <span className="text-[13px] text-[var(--color-fg-1)]">{children}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="ml-2 text-[var(--color-fg-4)] transition-colors hover:text-[var(--color-fg-1)]"
          aria-label="Cerrar"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
};

export default Toast;
