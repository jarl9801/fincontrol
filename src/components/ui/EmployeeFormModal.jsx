import { useState, useEffect, useMemo } from 'react';
import { X, Save, Loader2, HardHat, Briefcase } from 'lucide-react';
import { useProjects } from '../../hooks/useProjects';
import { PROJECTS as PROJECT_CONSTANTS } from '../../constants/projects';

/**
 * EmployeeFormModal — create/edit employees.
 *
 * Mirrors PartnerFormModal patterns: plain useState form, validate-before-submit,
 * Nothing Design System tokens, Spanish labels.
 *
 * Project picker: tries to load projects from Firestore (useProjects); if the
 * Firestore collection is empty (initial state), falls back to PROJECT_CONSTANTS
 * so the form is usable from day one.
 */
const EmployeeFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  editingEmployee,
  user,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const { projects: firestoreProjects } = useProjects(user);

  // Project options: prefer Firestore data, fall back to constants
  const projectOptions = useMemo(() => {
    if (firestoreProjects && firestoreProjects.length > 0) {
      return firestoreProjects.map((p) => ({
        id: p.id,
        label: p.name || p.code || p.id,
      }));
    }
    return PROJECT_CONSTANTS.map((label) => ({ id: label, label }));
  }, [firestoreProjects]);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    type: 'internal',
    aliasesText: '',
    projectIds: [],
    role: '',
    defaultCostCenter: '',
    email: '',
    phone: '',
    startDate: '',
    endDate: '',
    notes: '',
    status: 'active',
  });

  useEffect(() => {
    if (!isOpen) return;
    if (editingEmployee) {
      setFormData({
        firstName: editingEmployee.firstName || '',
        lastName: editingEmployee.lastName || '',
        type: editingEmployee.type || 'internal',
        aliasesText: (editingEmployee.aliases || []).join(', '),
        projectIds: editingEmployee.projectIds || [],
        role: editingEmployee.role || '',
        defaultCostCenter: editingEmployee.defaultCostCenter || '',
        email: editingEmployee.email || '',
        phone: editingEmployee.phone || '',
        startDate: editingEmployee.startDate || '',
        endDate: editingEmployee.endDate || '',
        notes: editingEmployee.notes || '',
        status: editingEmployee.status || 'active',
      });
    } else {
      setFormData({
        firstName: '',
        lastName: '',
        type: 'internal',
        aliasesText: '',
        projectIds: [],
        role: '',
        defaultCostCenter: '',
        email: '',
        phone: '',
        startDate: '',
        endDate: '',
        notes: '',
        status: 'active',
      });
    }
    setErrors({});
  }, [isOpen, editingEmployee]);

  const validate = () => {
    const newErrors = {};
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'El nombre es obligatorio';
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = 'Mínimo 2 caracteres';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'El apellido es obligatorio';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Formato de email inválido';
    }
    if (formData.startDate && formData.endDate && formData.endDate < formData.startDate) {
      newErrors.endDate = 'La fecha de baja no puede ser anterior al alta';
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    try {
      const aliases = formData.aliasesText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim();
      await onSubmit({
        fullName,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        aliases,
        type: formData.type,
        status: formData.status,
        projectIds: formData.projectIds,
        role: formData.role,
        defaultCostCenter: formData.defaultCostCenter,
        email: formData.email,
        phone: formData.phone,
        startDate: formData.startDate,
        endDate: formData.endDate,
        notes: formData.notes,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleProject = (projectId) => {
    setFormData((prev) => {
      const has = prev.projectIds.includes(projectId);
      return {
        ...prev,
        projectIds: has
          ? prev.projectIds.filter((id) => id !== projectId)
          : [...prev.projectIds, projectId],
      };
    });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] animate-scaleIn">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface-raised)] px-6 py-5">
          <div>
            <h3 className="text-xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
              {editingEmployee ? 'Editar empleado' : 'Nuevo empleado'}
            </h3>
            <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
              {editingEmployee
                ? 'Actualiza los datos del colaborador'
                : 'Registra un nuevo colaborador interno o externo'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-[var(--text-secondary)] transition hover:bg-transparent hover:text-[var(--text-disabled)]"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Type selector — internal vs external */}
          <div className="grid grid-cols-2 gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] p-1.5">
            {[
              { value: 'internal', label: 'Interno', icon: HardHat },
              { value: 'external', label: 'Externo', icon: Briefcase },
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setFormData({ ...formData, type: value })}
                className={`
                  flex items-center justify-center gap-2 py-3 text-sm font-semibold rounded-xl transition-all
                  ${formData.type === value
                    ? 'bg-[var(--surface-raised)] text-[var(--text-primary)] border border-[var(--border-visible)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}
                `}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>

          {/* Datos personales */}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">
              Datos personales
            </span>
            <div className="h-px flex-1 bg-[var(--border)]" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* First name */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-[var(--text-disabled)]">
                Nombre <span className="text-[var(--accent)]">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Jorge"
                className={`w-full rounded-lg border px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition ${
                  errors.firstName
                    ? 'border-[var(--accent)] bg-transparent'
                    : 'border-[var(--border)] bg-[var(--surface-raised)] focus:border-[var(--text-primary)]'
                }`}
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              />
              {errors.firstName && (
                <p className="mt-1 text-xs text-[var(--accent)]">{errors.firstName}</p>
              )}
            </div>

            {/* Last name */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-[var(--text-disabled)]">
                Apellido <span className="text-[var(--accent)]">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Moran"
                className={`w-full rounded-lg border px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition ${
                  errors.lastName
                    ? 'border-[var(--accent)] bg-transparent'
                    : 'border-[var(--border)] bg-[var(--surface-raised)] focus:border-[var(--text-primary)]'
                }`}
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
              {errors.lastName && (
                <p className="mt-1 text-xs text-[var(--accent)]">{errors.lastName}</p>
              )}
            </div>
          </div>

          {/* Aliases */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-[var(--text-disabled)]">
              Alias (separados por coma)
            </label>
            <input
              type="text"
              placeholder="Jorge Lider, Jorge L., Jorgito"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--text-primary)]"
              value={formData.aliasesText}
              onChange={(e) => setFormData({ ...formData, aliasesText: e.target.value })}
            />
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              Variantes del nombre que aparezcan en transacciones (para el matching futuro).
            </p>
          </div>

          {/* Role */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-[var(--text-disabled)]">
              Rol / Cargo
            </label>
            <input
              type="text"
              placeholder="Fusionador, Líder de obra, Supervisor..."
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--text-primary)]"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            />
          </div>

          {/* Asignaciones */}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">
              Asignaciones
            </span>
            <div className="h-px flex-1 bg-[var(--border)]" />
          </div>

          {/* Projects multi-select */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-[var(--text-disabled)]">
              Proyectos
            </label>
            <div className="grid grid-cols-1 gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] p-3 sm:grid-cols-2">
              {projectOptions.map((proj) => {
                const checked = formData.projectIds.includes(proj.id);
                return (
                  <label
                    key={proj.id}
                    className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-xs transition ${
                      checked
                        ? 'border-[var(--border-visible)] bg-[var(--surface)] text-[var(--text-primary)]'
                        : 'border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleProject(proj.id)}
                      className="h-3.5 w-3.5 accent-[var(--text-primary)]"
                    />
                    <span className="truncate">{proj.label}</span>
                  </label>
                );
              })}
            </div>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              Un colaborador puede pertenecer a varios proyectos a la vez.
            </p>
          </div>

          {/* Cost center */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-[var(--text-disabled)]">
              Centro de costo predeterminado
            </label>
            <input
              type="text"
              placeholder="CC-LOG, CC-ADM..."
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--text-primary)]"
              value={formData.defaultCostCenter}
              onChange={(e) => setFormData({ ...formData, defaultCostCenter: e.target.value })}
            />
          </div>

          {/* Contacto */}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">
              Contacto
            </span>
            <div className="h-px flex-1 bg-[var(--border)]" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Email */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-[var(--text-disabled)]">
                Email
              </label>
              <input
                type="email"
                placeholder="empleado@umtelkomd.com"
                className={`w-full rounded-lg border px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition ${
                  errors.email
                    ? 'border-[var(--accent)] bg-transparent'
                    : 'border-[var(--border)] bg-[var(--surface-raised)] focus:border-[var(--text-primary)]'
                }`}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-[var(--accent)]">{errors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-[var(--text-disabled)]">
                Teléfono
              </label>
              <input
                type="tel"
                placeholder="+49 ..."
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--text-primary)]"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          {/* Período */}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">
              Período
            </span>
            <div className="h-px flex-1 bg-[var(--border)]" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-[var(--text-disabled)]">
                Fecha de alta
              </label>
              <input
                type="date"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--text-primary)]"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-[var(--text-disabled)]">
                Fecha de baja
              </label>
              <input
                type="date"
                className={`w-full rounded-lg border px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition ${
                  errors.endDate
                    ? 'border-[var(--accent)] bg-transparent'
                    : 'border-[var(--border)] bg-[var(--surface-raised)] focus:border-[var(--text-primary)]'
                }`}
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
              {errors.endDate && (
                <p className="mt-1 text-xs text-[var(--accent)]">{errors.endDate}</p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-[var(--text-disabled)]">
              Notas
            </label>
            <textarea
              rows="2"
              placeholder="Notas internas sobre este colaborador..."
              className="w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--text-primary)]"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          {/* Status toggle (only when editing) */}
          {editingEmployee && (
            <div className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] p-4">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={formData.status === 'active'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.checked ? 'active' : 'inactive',
                      })
                    }
                  />
                  <div className="h-5 w-10 rounded-full bg-[var(--border)] transition-colors peer-checked:bg-transparent"></div>
                  <div className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-[var(--surface)] transition-transform peer-checked:translate-x-5"></div>
                </div>
                <span className="text-sm font-semibold text-[var(--text-disabled)]">Activo</span>
              </div>
              <span className="text-xs text-[var(--text-secondary)]">
                {formData.status === 'active'
                  ? 'Aparece en pickers y reportes'
                  : 'Inactivo — oculto del autocompletado'}
              </span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] py-3.5 font-semibold text-[var(--text-secondary)] transition hover:bg-transparent hover:text-[var(--text-disabled)]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`
                flex-[2] flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-white
                transition-all duration-200
                bg-[var(--text-primary)] hover:opacity-80
                ${submitting ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {submitting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              {submitting
                ? 'Guardando...'
                : editingEmployee
                ? 'Guardar cambios'
                : 'Crear empleado'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeFormModal;
