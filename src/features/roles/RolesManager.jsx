import React, { useState } from 'react';
import {
  Shield, UserPlus, Users, CheckSquare, Square, Info, Loader2, Clock, Mail
} from 'lucide-react';
import { USER_ROLES, ROLE_PERMISSIONS } from '../../constants/config';
import { useToast } from '../../contexts/ToastContext';

const AVAILABLE_ROLES = [
  { key: 'admin', label: 'Administrador', description: 'Acceso total al sistema' },
  { key: 'finance_manager', label: 'Gerente Financiero', description: 'Transacciones, reportes, presupuestos' },
  { key: 'project_manager', label: 'Gerente de Proyecto', description: 'Dashboard, transacciones del proyecto' },
  { key: 'viewer', label: 'Solo lectura', description: 'Visualizacion sin edicion' },
];

const MODULES = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'transactions', label: 'Transacciones' },
  { key: 'cxp', label: 'Cuentas por Pagar' },
  { key: 'cxc', label: 'Cuentas por Cobrar' },
  { key: 'reports', label: 'Reportes' },
  { key: 'cashflow', label: 'Flujo de Caja' },
  { key: 'settings', label: 'Configuracion' },
  { key: 'budget', label: 'Presupuesto' },
];

const DEFAULT_PERMISSION_MATRIX = {
  admin: ['dashboard', 'transactions', 'cxp', 'cxc', 'reports', 'cashflow', 'settings', 'budget'],
  finance_manager: ['dashboard', 'transactions', 'cxp', 'cxc', 'reports', 'cashflow', 'budget'],
  project_manager: ['dashboard', 'transactions', 'reports'],
  viewer: ['dashboard', 'reports'],
};

const KNOWN_USERS = [
  { email: 'jromero@umtelkomd.com', name: 'Jarl Romero', role: USER_ROLES['jromero@umtelkomd.com'] || 'admin' },
  { email: 'bsandoval@umtelkomd.com', name: 'Beatriz Sandoval', role: USER_ROLES['bsandoval@umtelkomd.com'] || 'manager' },
];

const RolesManager = ({ user, userRole }) => {
  const { showToast } = useToast();
  const [permissions, setPermissions] = useState(DEFAULT_PERMISSION_MATRIX);
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'viewer' });
  const [saving, setSaving] = useState(false);

  const isAdmin = userRole === 'admin';

  const togglePermission = (role, module) => {
    if (!isAdmin) return;
    setPermissions((prev) => {
      const current = prev[role] || [];
      const updated = current.includes(module)
        ? current.filter((m) => m !== module)
        : [...current, module];
      return { ...prev, [role]: updated };
    });
  };

  const handleInvite = () => {
    if (!inviteForm.email || !inviteForm.email.includes('@')) {
      showToast('Ingresa un email valido', 'error');
      return;
    }
    showToast('Las invitaciones requieren Firebase Auth Admin SDK. Configurar en Cloud Functions.', 'info');
    setInviteForm({ email: '', role: 'viewer' });
  };

  const handleSavePermissions = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      showToast('Matriz de permisos actualizada (solo en memoria). Para persistir, actualizar Firestore Security Rules.', 'info');
    }, 800);
  };

  const getRoleLabel = (roleKey) => {
    const found = AVAILABLE_ROLES.find((r) => r.key === roleKey);
    if (found) return found.label;
    // Map legacy roles
    if (roleKey === 'manager') return 'Gerente Financiero';
    if (roleKey === 'editor') return 'Editor';
    return roleKey;
  };

  const getRoleColor = (roleKey) => {
    switch (roleKey) {
      case 'admin': return '#ff9f0a';
      case 'manager':
      case 'finance_manager': return '#0a84ff';
      case 'project_manager': return '#30d158';
      case 'viewer': return '#8e8e93';
      case 'editor': return '#bf5af2';
      default: return '#8e8e93';
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Shield className="text-[#48484a] mb-4" size={48} />
        <h3 className="text-lg font-bold text-[#e5e5ea] mb-2">Acceso Restringido</h3>
        <p className="text-[#8e8e93] text-sm">Solo los administradores pueden gestionar roles y permisos.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-[rgba(255,159,10,0.12)] rounded-xl">
          <Shield className="text-[#ff9f0a]" size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[#e5e5ea]">Roles y Permisos</h2>
          <p className="text-sm text-[#8e8e93]">Gestiona usuarios, roles y permisos del sistema</p>
        </div>
      </div>

      {/* Current Users */}
      <div className="bg-[#1c1c1e] rounded-2xl p-6 shadow-sm border border-[rgba(255,255,255,0.08)]">
        <div className="flex items-center gap-2 mb-4">
          <Users className="text-[#0a84ff]" size={20} />
          <h3 className="text-lg font-bold text-[#e5e5ea]">Usuarios Activos</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.06)]">
                <th className="pb-3 text-xs font-semibold text-[#8e8e93] uppercase tracking-wide">Usuario</th>
                <th className="pb-3 text-xs font-semibold text-[#8e8e93] uppercase tracking-wide">Email</th>
                <th className="pb-3 text-xs font-semibold text-[#8e8e93] uppercase tracking-wide">Rol</th>
                <th className="pb-3 text-xs font-semibold text-[#8e8e93] uppercase tracking-wide">Permisos</th>
                <th className="pb-3 text-xs font-semibold text-[#8e8e93] uppercase tracking-wide">Ultima sesion</th>
              </tr>
            </thead>
            <tbody>
              {KNOWN_USERS.map((u) => {
                const rolePerms = ROLE_PERMISSIONS[u.role] || [];
                return (
                  <tr key={u.email} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.02)]">
                    <td className="py-3 text-[#e5e5ea] font-medium">{u.name}</td>
                    <td className="py-3 text-[#8e8e93] text-sm">{u.email}</td>
                    <td className="py-3">
                      <span
                        className="px-2.5 py-1 rounded-full text-xs font-semibold"
                        style={{
                          color: getRoleColor(u.role),
                          backgroundColor: `${getRoleColor(u.role)}1a`,
                        }}
                      >
                        {getRoleLabel(u.role)}
                      </span>
                    </td>
                    <td className="py-3 text-[#8e8e93] text-sm">
                      {rolePerms.length > 0 ? rolePerms.join(', ') : 'Sin permisos definidos'}
                    </td>
                    <td className="py-3 text-[#636366] text-sm">
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        —
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Permission Matrix */}
      <div className="bg-[#1c1c1e] rounded-2xl p-6 shadow-sm border border-[rgba(255,255,255,0.08)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CheckSquare className="text-[#30d158]" size={20} />
            <h3 className="text-lg font-bold text-[#e5e5ea]">Matriz de Permisos</h3>
          </div>
          <button
            onClick={handleSavePermissions}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-[#30d158] hover:bg-[#28b84c] text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Shield size={16} />}
            {saving ? 'Guardando...' : 'Guardar Permisos'}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.06)]">
                <th className="pb-3 text-xs font-semibold text-[#8e8e93] uppercase tracking-wide">Modulo</th>
                {AVAILABLE_ROLES.map((role) => (
                  <th key={role.key} className="pb-3 text-xs font-semibold uppercase tracking-wide text-center" style={{ color: getRoleColor(role.key) }}>
                    {role.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MODULES.map((mod) => (
                <tr key={mod.key} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.02)]">
                  <td className="py-3 text-[#e5e5ea] font-medium text-sm">{mod.label}</td>
                  {AVAILABLE_ROLES.map((role) => {
                    const hasPermission = (permissions[role.key] || []).includes(mod.key);
                    return (
                      <td key={role.key} className="py-3 text-center">
                        <button
                          onClick={() => togglePermission(role.key, mod.key)}
                          className="p-1 hover:bg-[rgba(255,255,255,0.06)] rounded transition-colors"
                          title={hasPermission ? 'Quitar permiso' : 'Otorgar permiso'}
                        >
                          {hasPermission ? (
                            <CheckSquare className="text-[#30d158] mx-auto" size={20} />
                          ) : (
                            <Square className="text-[#48484a] mx-auto" size={20} />
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite User */}
      <div className="bg-[#1c1c1e] rounded-2xl p-6 shadow-sm border border-[rgba(255,255,255,0.08)]">
        <div className="flex items-center gap-2 mb-4">
          <UserPlus className="text-[#bf5af2]" size={20} />
          <h3 className="text-lg font-bold text-[#e5e5ea]">Invitar Usuario</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-[#c7c7cc] mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#636366]" size={16} />
              <input
                type="email"
                className="w-full pl-10 pr-4 py-2.5 bg-[#2c2c2e] border border-[rgba(255,255,255,0.14)] rounded-lg text-[#e5e5ea] outline-none focus:ring-2 focus:ring-[#bf5af2]"
                value={inviteForm.email}
                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                placeholder="usuario@empresa.com"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#c7c7cc] mb-1">Rol</label>
            <select
              className="w-full px-4 py-2.5 bg-[#2c2c2e] border border-[rgba(255,255,255,0.14)] rounded-lg text-[#e5e5ea] outline-none focus:ring-2 focus:ring-[#bf5af2]"
              value={inviteForm.role}
              onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
            >
              {AVAILABLE_ROLES.map((r) => (
                <option key={r.key} value={r.key}>{r.label}</option>
              ))}
            </select>
          </div>
          <div>
            <button
              onClick={handleInvite}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#bf5af2] hover:bg-[#a349d6] text-white rounded-lg font-medium transition-colors w-full justify-center"
            >
              <UserPlus size={18} />
              Invitar
            </button>
          </div>
        </div>
      </div>

      {/* Available Roles Reference */}
      <div className="bg-[#1c1c1e] rounded-2xl p-6 shadow-sm border border-[rgba(255,255,255,0.08)]">
        <h3 className="text-lg font-bold text-[#e5e5ea] mb-4">Roles Disponibles</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {AVAILABLE_ROLES.map((role) => (
            <div key={role.key} className="flex items-center gap-3 p-3 bg-[#2c2c2e] rounded-lg">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: getRoleColor(role.key) }}
              />
              <div>
                <p className="text-sm font-medium text-[#e5e5ea]">{role.label}</p>
                <p className="text-xs text-[#636366]">{role.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-[rgba(10,132,255,0.08)] border border-[rgba(10,132,255,0.2)] rounded-xl p-4 flex items-start gap-3">
        <Info className="text-[#0a84ff] flex-shrink-0 mt-0.5" size={20} />
        <div>
          <p className="text-sm text-[#0a84ff] font-medium">Nota sobre seguridad</p>
          <p className="text-xs text-[#8e8e93] mt-1">
            Esta vista permite configurar la matriz de permisos visualmente. Para aplicar los permisos a nivel de base de datos, es necesario actualizar las Firestore Security Rules manualmente. Los cambios aqui solo afectan la interfaz del cliente.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RolesManager;
