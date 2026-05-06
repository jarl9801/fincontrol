# NEXUS.OS UI Guide

## Canonical path

New FinControl UI must use:

- Tokens: `--color-*`, `--font-*`, `--radius-sm|md|lg`
- Components: `src/components/ui/nexus/*`
- Classes: `.nx-*`, `label-mono`, `font-mono`, `font-display`

## Deprecated compatibility layer

The following exist only so legacy screens keep working during migration:

- CSS variables: `--surface`, `--surface-raised`, `--text-*`, `--accent`, `--border`, `--success`, `--warning`, `--error`, `--info`
- Utility classes: `nd-*`, `n-*`
- Legacy component classes: `.btn`, `.card`, `.badge`, `.alert`, `.table`
- Tailwind palette remaps such as `.bg-white`, `.text-gray-*`, `.shadow-*`

Do **not** use these in new code. When touching a view substantially, migrate the touched area to canonical NEXUS tokens/components instead of extending the compatibility layer.

## Radius policy

- Use `rounded-sm`, `rounded-md`, or `rounded-lg` for controls, panels, cards and filters.
- `rounded-full` is allowed only for avatars, status dots, loaders, progress tracks/fills, toggles, and `.nx-badge` pills.
- Buttons and filter controls are never pills.

## Accessibility baseline

- Tabs must use `role="tablist"`, `role="tab"`, `aria-selected`, roving `tabIndex`, and arrow-key navigation.
- Prefer real `<button>` elements for interactive cards/KPIs.
- If a table row is interactive, apply the shared row activation pattern from `src/utils/a11y.js` and stop propagation inside action cells.
- Toasts: `ok`/`warn` use polite status announcements; `err` uses assertive alert announcements.

## Enforcement

- ESLint blocks legacy token/utility aliases inside `src/components/ui/nexus/*`.
- During review, reject new use of `.btn`, `.card`, `.badge`, `.alert`, `.table`, `nd-*`, `n-*`, and legacy token aliases outside already-identified legacy migrations.
