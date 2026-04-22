import { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Loader2,
  Pencil,
  ToggleLeft,
  ToggleRight,
  Users,
  HardHat,
  Briefcase,
} from 'lucide-react';
import { useEmployees } from '../../hooks/useEmployees';
import { useTransactions } from '../../hooks/useTransactions';
import EmployeeFormModal from '../../components/ui/EmployeeFormModal';

const TYPE_LABELS = {
  internal: 'Interno',
  external: 'Externo',
};

const TYPE_COLORS = {
  internal: 'text-[var(--success)] bg-transparent border-[var(--border-visible)]',
  external: 'text-[var(--accent)] bg-transparent border-[var(--border-visible)]',
};

const Employees = ({ user, userRole }) => {
  const {
    employees,
    loading,
    getFilteredEmployees,
    createEmployee,
    updateEmployee,
    toggleEmployeeStatus,
  } = useEmployees(user);
  const { transactions } = useTransactions(user);

  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'internal' | 'external'
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  // Filter by tab + search
  const displayedEmployees = useMemo(() => {
    let filtered =
      activeTab === 'all'
        ? employees
        : getFilteredEmployees(activeTab, null);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.fullName?.toLowerCase().includes(q) ||
          e.firstName?.toLowerCase().includes(q) ||
          e.lastName?.toLowerCase().includes(q) ||
          e.email?.toLowerCase().includes(q) ||
          e.role?.toLowerCase().includes(q) ||
          (e.aliases || []).some((a) => a.toLowerCase().includes(q)),
      );
    }
    return filtered;
  }, [activeTab, employees, getFilteredEmployees, searchQuery]);

  // Counts for tab badges
  const counts = useMemo(() => {
    const active = employees.filter((e) => e.status === 'active');
    return {
      all: active.length,
      internal: active.filter((e) => e.type === 'internal').length,
      external: active.filter((e) => e.type === 'external').length,
    };
  }, [employees]);

  const handleOpenCreate = () => {
    setEditingEmployee(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (employee) => {
    setEditingEmployee(employee);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEmployee(null);
  };

  const handleSubmit = async (formData) => {
    if (editingEmployee) {
      await updateEmployee(editingEmployee.id, formData);
    } else {
      await createEmployee(formData);
    }
    handleCloseModal();
  };

  const handleToggleStatus = async (employee) => {
    setActionLoading(employee.id);
    try {
      await toggleEmployeeStatus(employee);
    } finally {
      setActionLoading(null);
    }
  };

  // Count transactions whose description matches the employee's name or aliases.
  // This is the "fragile fuzzy match" we want to replace later, but it's useful
  // as a sanity check in this admin view.
  const getTransactionCount = (employee) => {
    if (!transactions || !employee) return 0;
    const needles = [
      employee.fullName,
      employee.firstName,
      employee.lastName,
      ...(employee.aliases || []),
    ]
      .filter(Boolean)
      .map((s) => s.toLowerCase());
    if (needles.length === 0) return 0;
    return transactions.filter((t) => {
      const desc = t.description?.toLowerCase() || '';
      return needles.some((n) => n.length >= 3 && desc.includes(n));
    }).length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--text-primary)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header + Add button */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-[var(--border-visible)] bg-[var(--surface)]">
            <HardHat size={18} className="text-[var(--text-primary)]" />
          </div>
          <div>
            <p className="nd-labelst text-[var(--text-secondary)]">Master data</p>
            <h3 className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">
              Empleados
            </h3>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--border-visible)] bg-[var(--surface)] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-80"
        >
          <Plus size={15} />
          Nuevo empleado
        </button>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2">
        <div className="flex items-center gap-1">
          {[
            { key: 'all', label: 'Todos', icon: Users, count: counts.all },
            { key: 'internal', label: 'Internos', icon: HardHat, count: counts.internal },
            { key: 'external', label: 'Externos', icon: Briefcase, count: counts.external },
          ].map(({ key, label, icon: Icon, count }) => {
            const isActive = activeTab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'border border-[var(--border-visible)] bg-[var(--surface)] text-[var(--text-primary)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)]'
                }`}
              >
                <Icon size={15} />
                {label}
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                    isActive
                      ? 'bg-[var(--surface)] text-[var(--text-primary)]'
                      : 'bg-[var(--surface)] text-[var(--text-secondary)]'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]"
          />
          <input
            type="text"
            placeholder="Buscar por nombre, alias, email, rol..."
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] py-2.5 pl-10 pr-4 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--text-primary)]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
        {displayedEmployees.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-transparent">
              <HardHat size={28} className="text-[var(--text-secondary)]" />
            </div>
            <p className="text-base font-semibold text-[var(--text-disabled)]">
              {searchQuery ? 'Sin resultados' : 'Sin empleados registrados'}
            </p>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              {searchQuery
                ? `No se encontraron empleados para "${searchQuery}"`
                : 'Crea tu primer colaborador para empezar a trackear pagos por persona.'}
            </p>
            {!searchQuery && (
              <button
                type="button"
                onClick={handleOpenCreate}
                className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[var(--border-visible)] bg-[var(--surface)] px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--surface)]"
              >
                <Plus size={15} />
                Crear primer empleado
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="px-5 py-3.5 text-left nd-labelst text-[var(--text-secondary)]">
                    Nombre
                  </th>
                  <th className="px-4 py-3.5 text-left nd-labelst text-[var(--text-secondary)]">
                    Tipo
                  </th>
                  <th className="px-4 py-3.5 text-left nd-labelst text-[var(--text-secondary)]">
                    Rol
                  </th>
                  <th className="px-4 py-3.5 text-left nd-labelst text-[var(--text-secondary)]">
                    Proyectos
                  </th>
                  <th className="px-4 py-3.5 text-left nd-labelst text-[var(--text-secondary)]">
                    Email
                  </th>
                  <th className="px-4 py-3.5 text-center nd-labelst text-[var(--text-secondary)]">
                    Estado
                  </th>
                  <th className="px-4 py-3.5 text-center nd-labelst text-[var(--text-secondary)]">
                    Tx (fuzzy)
                  </th>
                  <th className="px-4 py-3.5 text-right nd-labelst text-[var(--text-secondary)]">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {displayedEmployees.map((employee, idx) => {
                  const txCount = getTransactionCount(employee);
                  const isInactive = employee.status === 'inactive';
                  return (
                    <tr
                      key={employee.id}
                      className={`border-b border-[var(--border)] transition-colors ${
                        isInactive
                          ? 'bg-[var(--surface-raised)]'
                          : idx % 2 === 0
                          ? 'bg-[var(--surface)]'
                          : 'bg-[var(--surface-raised)]'
                      } hover:bg-[var(--surface-raised)]`}
                    >
                      {/* Name */}
                      <td className="px-5 py-3.5">
                        <div>
                          <p
                            className={`font-semibold ${
                              isInactive
                                ? 'text-[var(--text-secondary)] line-through'
                                : 'text-[var(--text-primary)]'
                            }`}
                          >
                            {employee.fullName}
                          </p>
                          {employee.aliases && employee.aliases.length > 0 && (
                            <p className="text-xs text-[var(--text-secondary)]">
                              alias: {employee.aliases.join(', ')}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Type */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${
                            TYPE_COLORS[employee.type] || TYPE_COLORS.internal
                          }`}
                        >
                          {TYPE_LABELS[employee.type] || 'Interno'}
                        </span>
                      </td>

                      {/* Role */}
                      <td className="px-4 py-3.5">
                        {employee.role ? (
                          <span className="text-[var(--text-disabled)]">{employee.role}</span>
                        ) : (
                          <span className="text-[var(--text-secondary)]">—</span>
                        )}
                      </td>

                      {/* Projects */}
                      <td className="px-4 py-3.5">
                        {employee.projectIds && employee.projectIds.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {employee.projectIds.slice(0, 3).map((pid) => (
                              <span
                                key={pid}
                                className="rounded-full border border-[var(--border)] px-2 py-0.5 text-[10px] text-[var(--text-disabled)]"
                              >
                                {pid}
                              </span>
                            ))}
                            {employee.projectIds.length > 3 && (
                              <span className="text-[10px] text-[var(--text-secondary)]">
                                +{employee.projectIds.length - 3}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[var(--text-secondary)]">—</span>
                        )}
                      </td>

                      {/* Email */}
                      <td className="px-4 py-3.5">
                        {employee.email ? (
                          <a
                            href={`mailto:${employee.email}`}
                            className="text-[var(--text-primary)] hover:underline"
                          >
                            {employee.email}
                          </a>
                        ) : (
                          <span className="text-[var(--text-secondary)]">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(employee)}
                          disabled={actionLoading === employee.id}
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                            isInactive
                              ? 'bg-[var(--surface)] text-[var(--text-secondary)]'
                              : 'bg-transparent text-[var(--success)]'
                          }`}
                          title={isInactive ? 'Activar' : 'Desactivar'}
                        >
                          {actionLoading === employee.id ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : isInactive ? (
                            <ToggleLeft size={15} />
                          ) : (
                            <ToggleRight size={15} />
                          )}
                          {isInactive ? 'Inactivo' : 'Activo'}
                        </button>
                      </td>

                      {/* Transaction count */}
                      <td className="px-4 py-3.5 text-center">
                        {txCount > 0 ? (
                          <span
                            className="inline-flex items-center gap-1 rounded-full bg-[var(--surface)] px-2.5 py-1 text-xs font-semibold text-[var(--text-primary)]"
                            title="Match aproximado por nombre/alias en descripciones"
                          >
                            {txCount}
                          </span>
                        ) : (
                          <span className="text-[var(--text-secondary)]">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(employee)}
                            className="flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] transition-colors hover:border-[var(--text-primary)] hover:text-[var(--text-primary)]"
                            title="Editar"
                          >
                            <Pencil size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Employee Modal */}
      <EmployeeFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        editingEmployee={editingEmployee}
        user={user}
      />
    </div>
  );
};

export default Employees;
