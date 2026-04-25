/**
 * NEXUS.OS — Tabs
 *
 * Mono uppercase tabs with accent underline on active.
 * Controlled component.
 *
 * <Tabs value={tab} onChange={setTab} items={[
 *   { value: 'overview', label: 'Overview' },
 *   { value: 'detail',   label: 'Detalle' },
 * ]} />
 */
const Tabs = ({ value, onChange, items, className = '' }) => (
  <div className={`nx-tabs ${className}`}>
    {items.map((item) => (
      <button
        key={item.value}
        type="button"
        onClick={() => onChange?.(item.value)}
        className={`nx-tab ${value === item.value ? 'active' : ''}`}
      >
        {item.label}
      </button>
    ))}
  </div>
);

export default Tabs;
