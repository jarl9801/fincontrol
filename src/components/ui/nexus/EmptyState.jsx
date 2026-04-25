/**
 * NEXUS.OS — EmptyState
 *
 * Standard empty placeholder for tables, lists, panels.
 * Bracketed mono header (Nexus signature) + sans body + optional CTA.
 *
 * <EmptyState
 *   title="Sin transacciones"
 *   description="Importa registros o crea uno nuevo."
 *   action={<Button variant="primary">Crear</Button>}
 * />
 */
const EmptyState = ({ title, description, action, icon: Icon, className = '' }) => (
  <div className={`flex flex-col items-center justify-center py-12 px-6 text-center ${className}`}>
    {Icon && (
      <div className="w-10 h-10 rounded-md border border-[var(--border)] bg-[var(--surface-raised)] flex items-center justify-center mb-4">
        <Icon size={16} className="text-[var(--text-disabled)]" />
      </div>
    )}
    {title && (
      <p className="nd-label text-[var(--text-secondary)] mb-2">[{title}]</p>
    )}
    {description && (
      <p className="text-[13px] text-[var(--text-disabled)] max-w-[400px] leading-relaxed">
        {description}
      </p>
    )}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export default EmptyState;
