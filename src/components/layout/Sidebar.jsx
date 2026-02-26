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

const Sidebar = ({ user, userRole, view, setView, onNewTransaction }) => {
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
          relative flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150
          ${isActive
            ? 'bg-[rgba(0,200,83,0.15)] text-white'
            : 'text-[#636366] hover:bg-[rgba(255,255,255,0.05)] hover:text-white'}
        `}
      >
        {isActive && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-[#00C853] rounded-r-md" />
        )}
        <Icon size={20} className={isActive ? 'text-[#00C853]' : 'text-[#636366]'} />
        <span className="flex-1 text-left">{label}</span>
      </button>
    );
  };

  const SectionTitle = ({ children }) => (
    <div className="pt-6 pb-2 px-4 text-[11px] font-semibold text-[#8e8e93] uppercase tracking-wider">
      {children}
    </div>
  );

  return (
    <aside className="hidden md:flex flex-col w-[260px] h-screen sticky top-0" style={{ background: 'rgba(28, 28, 30, 0.85)', backdropFilter: 'blur(40px) saturate(180%)', WebkitBackdropFilter: 'blur(40px) saturate(180%)', borderRight: '0.5px solid rgba(255,255,255,0.08)' }}>
      {/* Logo */}
      <div className="p-6 border-b border-[rgba(255,255,255,0.06)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <Briefcase className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">UMTELKOMD</h1>
            <p className="text-[10px] text-[#636366] font-medium uppercase tracking-wider">Sistema Financiero</p>
          </div>
        </div>

        {/* User Info Card */}
        <div className="mt-4 p-3 bg-[rgba(255,255,255,0.04)] rounded-xl border border-[rgba(255,255,255,0.06)]">
          <p className="text-sm font-medium text-slate-200 truncate">{user?.email}</p>
          <span className={`
            inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase
            ${userRole === 'admin'
              ? 'bg-[rgba(191,90,242,0.12)] text-purple-300'
              : 'bg-[rgba(10,132,255,0.12)] text-blue-300'}
          `}>
            {userRole === 'admin' ? 'Administrador' : 'Editor'}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {userRole === 'admin' && (
          <NavItem id="dashboard" label="Dashboard" icon={LayoutDashboard} />
        )}
        <NavItem id="transactions" label="Todas las Transacciones" icon={Filter} />

        {userRole === 'admin' && (
          <>
            <SectionTitle>Gestion de Deudas</SectionTitle>
            <NavItem id="cxp" label="Cuentas por Pagar" icon={ArrowDownCircle} />
            <NavItem id="cxc" label="Cuentas por Cobrar" icon={ArrowUpCircle} />

            <SectionTitle>Reportes</SectionTitle>
            <NavItem id="executive-summary" label="Resumen Ejecutivo" icon={FileText} />
            <NavItem id="reports" label="Estado de Resultados" icon={TrendingUp} />
            <NavItem id="financial-ratios" label="Ratios Financieros" icon={Activity} />
            <NavItem id="report-cxp" label="Reporte CXP" icon={Clock} />
            <NavItem id="report-cxc" label="Reporte CXC" icon={BarChart3} />
            <NavItem id="cashflow" label="Flujo de Caja" icon={DollarSign} />

            <SectionTitle>Configuracion</SectionTitle>
            <NavItem id="projects" label="Proyectos" icon={FolderOpen} />
            <NavItem id="categories" label="Categorias" icon={Tag} />
            <NavItem id="cost-centers" label="Centros de Costo" icon={Building2} />
            <NavItem id="bank-account" label="Cuenta Bancaria" icon={Landmark} />
          </>
        )}
      </nav>

      {/* Actions */}
      <div className="p-4 border-t border-[rgba(255,255,255,0.06)] space-y-3">
        <button
          onClick={onNewTransaction}
          className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-3.5 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
        >
          <Plus size={18} /> Nueva Transaccion
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 w-full bg-[rgba(255,255,255,0.14)]/50 hover:bg-[rgba(255,255,255,0.14)] text-[#636366] hover:text-white px-4 py-3 rounded-xl font-medium transition-all"
        >
          <LogOut size={18} /> Cerrar Sesion
        </button>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-[rgba(255,255,255,0.06)] text-center">
        <p className="text-[10px] text-[#8e8e93]">
          Desarrollado por <span className="font-semibold text-[#636366]">HMR NEXUS</span>
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
