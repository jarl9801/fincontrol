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
  BarChart3
} from 'lucide-react';

const MobileMenu = ({ isOpen, onClose, user, userRole, view, setView, onNewTransaction }) => {
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
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

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Menu Panel */}
      <div className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-xl flex flex-col animate-slideIn">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-600">
            <Briefcase size={28} />
            <div>
              <h1 className="text-xl font-bold tracking-tight">UMTELKOMD</h1>
              <p className="text-xs text-slate-400">Sistema Financiero</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* User Info */}
        <div className="px-6 py-3 border-b border-slate-100">
          <p className="text-sm font-medium text-slate-700">{user?.email}</p>
          <p className="text-xs text-blue-600">{userRole === 'admin' ? 'Administrador' : 'Editor'}</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {userRole === 'admin' && (
            <button
              onClick={() => handleNavigation('dashboard')}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors ${view === 'dashboard' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <LayoutDashboard size={18} /> Dashboard
            </button>
          )}
          <button
            onClick={() => handleNavigation('transactions')}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors ${view === 'transactions' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <Filter size={18} /> Todas las Transacciones
          </button>

          {userRole === 'admin' && (
            <>
              <div className="pt-4 pb-2 px-4 text-xs font-semibold text-slate-400 uppercase">Gestion de Deudas</div>
              <button
                onClick={() => handleNavigation('cxp')}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors ${view === 'cxp' ? 'bg-rose-50 text-rose-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <ArrowDownCircle size={18} /> Cuentas por Pagar
              </button>
              <button
                onClick={() => handleNavigation('cxc')}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors ${view === 'cxc' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <ArrowUpCircle size={18} /> Cuentas por Cobrar
              </button>

              <div className="pt-4 pb-2 px-4 text-xs font-semibold text-slate-400 uppercase">Reportes</div>
              <button
                onClick={() => handleNavigation('reports')}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors ${view === 'reports' ? 'bg-purple-50 text-purple-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <TrendingUp size={18} /> Estado de Resultados
              </button>
              <button
                onClick={() => handleNavigation('report-cxp')}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors ${view === 'report-cxp' ? 'bg-rose-50 text-rose-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <Clock size={18} /> Reporte CXP
              </button>
              <button
                onClick={() => handleNavigation('report-cxc')}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors ${view === 'report-cxc' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <BarChart3 size={18} /> Reporte CXC
              </button>
              <button
                onClick={() => handleNavigation('cashflow')}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors ${view === 'cashflow' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <DollarSign size={18} /> Flujo de Caja
              </button>

              <div className="pt-4 pb-2 px-4 text-xs font-semibold text-slate-400 uppercase">Configuracion</div>
              <button
                onClick={() => handleNavigation('categories')}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors ${view === 'categories' ? 'bg-amber-50 text-amber-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <Tag size={18} /> Categorias
              </button>
              <button
                onClick={() => handleNavigation('cost-centers')}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors ${view === 'cost-centers' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <Building2 size={18} /> Centros de Costo
              </button>
            </>
          )}
        </nav>

        {/* Actions */}
        <div className="p-4 border-t border-slate-100 space-y-2">
          <button
            onClick={handleNewTransactionClick}
            className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-all shadow-md"
          >
            <Plus size={18} /> Nueva Transaccion
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-3 rounded-lg font-medium transition-colors"
          >
            <LogOut size={18} /> Cerrar Sesion
          </button>
        </div>
      </div>
    </div>
  );
};

export const MobileMenuButton = ({ onClick }) => (
  <button
    onClick={onClick}
    className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
  >
    <Menu size={24} />
  </button>
);

export default MobileMenu;
