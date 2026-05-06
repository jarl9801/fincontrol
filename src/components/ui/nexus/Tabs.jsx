import { useId, useRef } from 'react';

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
const safeId = (value) => String(value).replace(/[^a-zA-Z0-9_-]/g, '-');

const Tabs = ({ value, onChange, items, className = '', id }) => {
  const generatedId = useId();
  const baseId = id || `nx-tabs-${generatedId}`;
  const tabRefs = useRef([]);

  const focusTab = (index) => {
    const next = (index + items.length) % items.length;
    tabRefs.current[next]?.focus();
    onChange?.(items[next].value);
  };

  const handleKeyDown = (event, index) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      focusTab(index + 1);
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      focusTab(index - 1);
    }
    if (event.key === 'Home') {
      event.preventDefault();
      focusTab(0);
    }
    if (event.key === 'End') {
      event.preventDefault();
      focusTab(items.length - 1);
    }
  };

  return (
    <div className={`nx-tabs ${className}`} role="tablist">
      {items.map((item, index) => {
        const selected = value === item.value;
        const itemId = safeId(item.value);
        return (
          <button
            key={item.value}
            ref={(node) => { tabRefs.current[index] = node; }}
            type="button"
            role="tab"
            id={`${baseId}-${itemId}-tab`}
            aria-selected={selected}
            aria-controls={item.panelId || `${baseId}-${itemId}-panel`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange?.(item.value)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={`nx-tab ${selected ? 'active' : ''}`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
};

export default Tabs;
