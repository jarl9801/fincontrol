import { signOut } from 'firebase/auth';
import { auth } from '../../services/firebase';
import {
  Briefcase,
  LayoutDashboard,
  Filter,
  ArrowUpCircle,
  ArrowDownCircle,
  DollarSign,
  Plus,
  LogOut,
  Tag,
  Building2,
  TrendingUp,
  BarChart3,
  Clock,
  FolderOpen,
  Landmark,
  FileText,
  PieChart,
  Activity
} from 'lucide-react';

const Sidebar = ({ user, userRole, hasPermission, view, setView, onNewTransaction }) => {
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error al cerrar sesion:', error);
    }
  };

  const NavItem = ({ id, label, icon: Icon }) => {
    const isActive = view === id;

    return (
      <button
        onClick={() => setView(id)}
        className={`
          relative flex items-center gap-[10px] w-full px-3 py-[7px] rounded-lg text-[13px] font-medium transition-all duration-150
          ${isActive
            ? 'bg-[rgba(255,255,255,0.08)] text-white'
            : 'text-[#8e8e93] hover:bg-[rgba(255,255,255,0.06)] hover:text-white'}
        `}
      >
        {isActive && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#30d158] rounded-r" />
        )}
        <Icon size={18} className={isActive ? 'text-[#30d158]' : 'text-[#636366]'} />
        <span className="flex-1 text-left">{label}</span>
      </button>
    );
  };

  const SectionTitle = ({ children }) => (
    <div className="pt-5 pb-1.5 px-3 text-[11px] font-semibold text-[#48484a] uppercase tracking-wider">
      {children}
    </div>
  );

  return (
    <aside className="hidden md:flex flex-col w-[260px] h-screen sticky top-0" style={{ background: 'rgba(28, 28, 30, 0.85)', backdropFilter: 'blur(40px) saturate(180%)', WebkitBackdropFilter: 'blur(40px) saturate(180%)', borderRight: '0.5px solid rgba(255,255,255,0.08)' }}>
      {/* Logo */}
      <div className="p-6 border-b border-[rgba(255,255,255,0.06)]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-[#30d158] to-[#0a84ff] rounded-[10px] flex items-center justify-center" style={{ boxShadow: '0 2px 8px rgba(48, 209, 88, 0.25)' }}>
            <Briefcase className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-[15px] font-bold text-white tracking-tight">UMTELKOMD</h1>
            <p className="text-[11px] text-[#8e8e93] font-medium">Sistema Financiero</p>
          </div>
        </div>

        {/* User Info Card */}
        <div className="mt-4 p-3 bg-[rgba(255,255,255,0.04)] rounded-xl border border-[rgba(255,255,255,0.06)]">
          <p className="text-sm font-medium text-white/80 truncate">{user?.email}</p>
          <span className={`
            inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase
            ${userRole === 'admin'
              ? 'bg-[rgba(191,90,242,0.12)] text-[#bf5af2]'
              : 'bg-[rgba(10,132,255,0.12)] text-[#0a84ff]'}
          `}>
            {userRole === 'admin' ? 'Administrador' : userRole === 'manager' ? 'Manager' : 'Editor'}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {hasPermission('dashboard') && (
          <NavItem id="dashboard" label="Dashboard" icon={LayoutDashboard} />
        )}
        <NavItem id="transactions" label="Todas las Transacciones" icon={Filter} />

        {(hasPermission('cxp') || hasPermission('cxc')) && (
          <SectionTitle>Gestion de Deudas</SectionTitle>
        )}
        {hasPermission('cxp') && (
          <NavItem id="cxp" label="Cuentas por Pagar" icon={ArrowDownCircle} />
        )}
        {hasPermission('cxc') && (
          <NavItem id="cxc" label="Cuentas por Cobrar" icon={ArrowUpCircle} />
        )}

        {hasPermission('reports') && (
          <>
            <SectionTitle>Reportes</SectionTitle>
            <NavItem id="executive-summary" label="Resumen Ejecutivo" icon={FileText} />
            <NavItem id="reports" label="Estado de Resultados" icon={TrendingUp} />
            <NavItem id="financial-ratios" label="Ratios Financieros" icon={Activity} />
            <NavItem id="report-cxp" label="Reporte CXP" icon={Clock} />
            <NavItem id="report-cxc" label="Reporte CXC" icon={BarChart3} />
            <NavItem id="cashflow" label="Flujo de Caja" icon={DollarSign} />
          </>
        )}

        {hasPermission('settings') && (
          <>
            <SectionTitle>Configuracion</SectionTitle>
            <NavItem id="projects" label="Proyectos" icon={FolderOpen} />
            <NavItem id="categories" label="Categorias" icon={Tag} />
            <NavItem id="cost-centers" label="Centros de Costo" icon={Building2} />
            <NavItem id="bank-account" label="Cuenta Bancaria" icon={Landmark} />
          </>
        )}
      </nav>

      {/* Actions */}
      <div className="p-3 border-t border-[rgba(255,255,255,0.06)] space-y-2">
        <button
          onClick={onNewTransaction}
          className="flex items-center justify-center gap-2 w-full bg-[#30d158] hover:bg-[#28c74e] text-white px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all"
        >
          <Plus size={16} /> Nueva Transacción
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 w-full hover:bg-[rgba(255,255,255,0.06)] text-[#8e8e93] hover:text-white px-4 py-2 rounded-lg text-[13px] font-medium transition-all"
        >
          <LogOut size={16} /> Cerrar Sesión
        </button>
      </div>

      {/* Footer */}
      <div className="px-3 py-2.5 border-t border-[rgba(255,255,255,0.06)] text-center">
        <p className="text-[10px] text-[#48484a]">
          Desarrollado por <span className="font-semibold text-[#636366]">HMR NEXUS</span>
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
