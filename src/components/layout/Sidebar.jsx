import { signOut } from 'firebase/auth';
import { auth } from '../../services/firebase';
import {
  Briefcase,
  LayoutDashboard,
  Filter,
  ArrowUpCircle,
  ArrowDownCircle,
  FileText,
  Clock,
  DollarSign,
  Plus,
  LogOut,
  Tag,
  Building2,
  TrendingUp,
  BarChart3
} from 'lucide-react';

const Sidebar = ({ user, userRole, view, setView, onNewTransaction }) => {
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200">
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center gap-2 text-blue-600">
          <Briefcase size={28} />
          <div>
            <h1 className="text-xl font-bold tracking-tight">UMTELKOMD</h1>
            <p className="text-xs text-slate-400">Sistema Financiero</p>
          </div>
        </div>
        <div className="mt-3 text-xs text-slate-500">
          <p className="font-medium">{user?.email}</p>
          <p className="text-blue-600">{userRole === 'admin' ? 'Administrador' : 'Editor'}</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {userRole === 'admin' && (
          <button
            onClick={() => setView('dashboard')}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors ${view === 'dashboard' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <LayoutDashboard size={18} /> Dashboard
          </button>
        )}
        <button
          onClick={() => setView('transactions')}
          className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors ${view === 'transactions' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          <Filter size={18} /> Todas las Transacciones
        </button>

        {userRole === 'admin' && (
          <>
            <div className="pt-4 pb-2 px-4 text-xs font-semibold text-slate-400 uppercase">Gestion de Deudas</div>
            <button
              onClick={() => setView('cxp')}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors ${view === 'cxp' ? 'bg-rose-50 text-rose-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <ArrowDownCircle size={18} /> Cuentas por Pagar (CXP)
            </button>
            <button
              onClick={() => setView('cxc')}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors ${view === 'cxc' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <ArrowUpCircle size={18} /> Cuentas por Cobrar (CXC)
            </button>

            <div className="pt-4 pb-2 px-4 text-xs font-semibold text-slate-400 uppercase">Reportes</div>
            <button
              onClick={() => setView('reports')}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors ${view === 'reports' ? 'bg-purple-50 text-purple-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <TrendingUp size={18} /> Estado de Resultados
            </button>
            <button
              onClick={() => setView('report-cxp')}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors ${view === 'report-cxp' ? 'bg-rose-50 text-rose-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Clock size={18} /> Reporte CXP
            </button>
            <button
              onClick={() => setView('report-cxc')}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors ${view === 'report-cxc' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <BarChart3 size={18} /> Reporte CXC
            </button>
            <button
              onClick={() => setView('cashflow')}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors ${view === 'cashflow' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <DollarSign size={18} /> Flujo de Caja
            </button>

            <div className="pt-4 pb-2 px-4 text-xs font-semibold text-slate-400 uppercase">Configuracion</div>
            <button
              onClick={() => setView('categories')}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors ${view === 'categories' ? 'bg-amber-50 text-amber-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Tag size={18} /> Categorias
            </button>
            <button
              onClick={() => setView('cost-centers')}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors ${view === 'cost-centers' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Building2 size={18} /> Centros de Costo
            </button>
          </>
        )}
      </nav>

      <div className="p-4 border-t border-slate-100 space-y-2">
        <button
          onClick={onNewTransaction}
          className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-all shadow-md hover:shadow-lg active:scale-95"
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
    </aside>
  );
};

export default Sidebar;
