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
  Menu,
  X,
  Tag,
  Building2,
  TrendingUp,
  Clock,
  BarChart3,
  FolderOpen,
  Landmark,
  FileText,
  Activity
} from 'lucide-react';

const MobileMenu = ({ isOpen, onClose, user, userRole, view, setView, onNewTransaction }) => {
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error al cerrar sesion:', error);
    }
  };

  const handleNavigation = (newView) => {
    setView(newView);
    onClose();
  };

  const handleNewTransactionClick = () => {
    onNewTransaction();
    onClose();
  };

  if (!isOpen) return null;

  const NavItem = ({ id, label, icon: Icon }) => {
    const isActive = view === id;

    return (
      <button
        onClick={() => handleNavigation(id)}
        className={`
          relative flex items-center gap-3 w-full px-4 py-3.5 rounded-lg text-sm font-medium transition-all
          ${isActive
            ? 'bg-[rgba(59,130,246,0.08)]0/20 text-white'
            : 'text-[#585890] hover:bg-[#1a1a2e]/8 hover:text-white'}
        `}
      >
        {isActive && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-[rgba(59,130,246,0.08)]0 rounded-r-md" />
        )}
        <Icon size={20} className={isActive ? 'text-blue-400' : 'text-[#6868a0]'} />
        <span className="flex-1 text-left">{label}</span>
      </button>
    );
  };

  const SectionTitle = ({ children }) => (
    <div className="pt-4 pb-2 px-4 text-[11px] font-semibold text-[#8888b0] uppercase tracking-wider">
      {children}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
        onClick={onClose}
      />

      {/* Menu Panel */}
      <div
        className="absolute left-0 top-0 bottom-0 w-80 shadow-2xl flex flex-col animate-slideIn"
        style={{ background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)' }}
      >
        {/* Header */}
        <div className="p-5 border-b border-[rgba(58,58,90,0.5)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">UMTELKOMD</h1>
                <p className="text-[10px] text-[#6868a0] font-medium uppercase">Sistema Financiero</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-[#6868a0] hover:text-white hover:bg-[#3a3a5a]/50 rounded-xl transition-all"
            >
              <X size={24} />
            </button>
          </div>

          {/* User Info */}
          <div className="mt-4 p-3 bg-[rgba(30,30,56,0.5)] rounded-xl border border-[rgba(58,58,90,0.5)]">
            <p className="text-sm font-medium text-slate-200 truncate">{user?.email}</p>
            <span className={`
              inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase
              ${userRole === 'admin' ? 'bg-[rgba(168,85,247,0.08)]0/20 text-purple-300' : 'bg-[rgba(59,130,246,0.08)]0/20 text-blue-300'}
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
        <div className="p-4 border-t border-[rgba(58,58,90,0.5)] space-y-3">
          <button
            onClick={handleNewTransactionClick}
            className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-3.5 rounded-xl font-semibold shadow-lg transition-all"
          >
            <Plus size={20} /> Nueva Transaccion
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full bg-[#3a3a5a]/50 hover:bg-[#3a3a5a] text-[#585890] hover:text-white px-4 py-3 rounded-xl font-medium transition-all"
          >
            <LogOut size={20} /> Cerrar Sesion
          </button>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-[rgba(58,58,90,0.5)] text-center">
          <p className="text-[10px] text-[#8888b0]">
            Desarrollado por <span className="font-semibold text-[#6868a0]">HMR NEXUS</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export const MobileMenuButton = ({ onClick }) => (
  <button
    onClick={onClick}
    className="md:hidden p-2.5 text-[#9898b8] hover:text-[#e8e8f0] hover:bg-[rgba(255,255,255,0.05)] rounded-xl transition-all"
  >
    <Menu size={24} />
  </button>
);

export default MobileMenu;
