/**
 * NEXUS.OS — Toggle
 *
 * Controlled switch. Off = surface raised + neutral knob, On = accent + ink knob.
 *
 * <Toggle checked={on} onChange={setOn} label="Notificaciones" />
 */
const Toggle = ({ checked = false, onChange, label, disabled = false, className = '' }) => (
  <label className={`inline-flex items-center gap-3 cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange?.(!checked)}
      className={`nx-toggle ${checked ? 'on' : ''}`}
    />
    {label && <span className="text-[13px] text-[var(--text-primary)]">{label}</span>}
  </label>
);

export default Toggle;
