import { signOut } from 'firebase/auth';
import { useLocation, useNavigate } from 'react-router-dom';
import {
 ArrowLeftRight,
 Briefcase,
 Building2,
 FolderKanban,
 Landmark,
 LayoutDashboard,
 LogOut,
 Menu,
 Plus,
 ReceiptText,
 Scale,
 Settings,
 WalletCards,
 X,
} from 'lucide-react';
import { auth } from '../../services/firebase';

const NAV_ITEMS = [
 { path: '/', label: 'Dashboard', icon: LayoutDashboard, permission: 'dashboard' },
 { path: '/cashflow', label: 'Tesoreria', icon: WalletCards, permission: 'reports' },
 { path: '/transactions', label: 'Transacciones', icon: Landmark, permission: 'dashboard' },
 { path: '/cxc', label: 'CXC', icon: ReceiptText, permission: 'cxc' },
 { path: '/cxp', label: 'CXP', icon: ReceiptText, permission: 'cxp' },
 { path: '/reportes', label: 'Reportes', icon: Briefcase, permission: 'reports' },
 { path: '/proyectos', label: 'Proyectos', icon: FolderKanban, permission: 'reports' },
 { path: '/presupuesto', label: 'Presupuesto', icon: Briefcase, permission: 'reports' },
 { path: '/conciliacion', label: 'Conciliacion', icon: Scale, permission: 'cxp' },
 { path: '/import-export', label: 'Importar', icon: ArrowLeftRight, permission: 'settings' },
 { path: '/configuracion', label: 'Config', icon: Settings, permission: 'settings' },
 { path: '/partners', label: 'Partners', icon: Building2, permission: 'settings' },
];

const MobileMenu = ({ isOpen, onClose, user, userRole, hasPermission, onNewTransaction }) => {
 const navigate = useNavigate();
 const location = useLocation();

 if (!isOpen) return null;

 const handleLogout = async () => {
 if (!window.confirm('¿Estás seguro que deseas cerrar sesión?')) return;
 try {
 await signOut(auth);
 } catch (error) {
 console.error('Error al cerrar sesión:', error);
 }
 };

 const visibleItems = NAV_ITEMS.filter((item) => !item.permission || hasPermission(item.permission));

 return (
 <div className="fixed inset-0 z-[230] md:hidden">
 {/* Backdrop */}
 <div className="absolute inset-0 bg-[var(--surface)]" onClick={onClose} />

 {/* Panel */}
 <div className="absolute left-0 top-0 bottom-0 flex w-[84vw] max-w-[320px] flex-col border-r border-[var(--border)] bg-[var(--surface)] px-4 py-5 text-[var(--text-primary)] animate-slideIn">
 {/* Header */}
 <div className="mb-6 flex items-start justify-between">
 <div className="flex items-center gap-3">
 <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border-visible)] bg-[var(--black)]">
 <Briefcase size={16} className="text-[var(--text-primary)]" />
 </div>
 <div>
 <p className="font-[Doto] text-[16px] font-bold uppercase tracking-[0.04em] text-[var(--text-display)]">
 FinControl
 </p>
 <p className="font-[Space_Mono] text-[9px] uppercase tracking-[0.18em] text-[var(--text-disabled)]">
 Operations Console
 </p>
 </div>
 </div>
 <button
 type="button"
 onClick={onClose}
 className="flex h-9 w-9 items-center justify-center border border-[var(--border-visible)] text-[var(--text-disabled)] hover:text-[var(--text-primary)] rounded-lg transition-colors"
 >
 <X size={16} />
 </button>
 </div>

 {/* User */}
 <button
 type="button"
 onClick={() => { navigate('/perfil'); onClose(); }}
 className="mb-6 flex w-full items-center gap-3 border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-3 text-left rounded-lg"
 >
 <div className="flex h-8 w-8 items-center justify-center border border-[var(--border-visible)] font-[Space_Mono] text-[12px] font-bold text-[var(--text-primary)] rounded-lg">
 {(user?.displayName || user?.email || '?')[0].toUpperCase()}
 </div>
 <div className="min-w-0 flex-1">
 <p className="truncate text-[13px] text-[var(--text-primary)]">{user?.displayName || user?.email}</p>
 <p className="truncate font-[Space_Mono] text-[9px] uppercase tracking-[0.16em] text-[var(--text-disabled)]">
 {userRole === 'admin' ? 'Admin' : userRole === 'manager' ? 'Manager' : 'Editor'}
 </p>
 </div>
 </button>

 {/* Nav */}
 <div className="flex-1 overflow-y-auto">
 {visibleItems.map((item) => {
 const Icon = item.icon;
 const active = location.pathname === item.path;
 return (
 <button
 key={item.path}
 type="button"
 onClick={() => { navigate(item.path); onClose(); }}
 className={`flex w-full items-center gap-3 px-3 py-3 text-left transition-colors ${
 active
 ? 'text-[var(--text-display)] border-l-2 border-l-[var(--text-display)]'
 : 'text-[var(--text-disabled)] hover:text-[var(--text-primary)]'
 }`}
 >
 <Icon size={16} />
 <span className="font-[Space_Mono] text-[11px] uppercase tracking-[0.06em]">{item.label}</span>
 </button>
 );
 })}
 </div>

 {/* Footer */}
 <div className="mt-5 border-t border-[var(--border)] pt-4 space-y-3">
 <button
 type="button"
 onClick={() => { onNewTransaction(); onClose(); }}
 className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--text-display)] px-4 py-3 font-[Space_Mono] text-[11px] uppercase tracking-[0.06em] text-[var(--black)]"
 >
 <Plus size={14} />
 Crear registro
 </button>
 <button
 type="button"
 onClick={handleLogout}
 className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[var(--border-visible)] px-4 py-3 font-[Space_Mono] text-[11px] uppercase tracking-[0.06em] text-[var(--text-disabled)] hover:text-[var(--text-primary)] hover:border-[var(--text-primary)] transition-colors"
 aria-label="Cerrar sesión"
 >
 <LogOut size={14} />
 Cerrar sesion
 </button>
 </div>
 </div>
 </div>
 );
};

export const MobileMenuButton = ({ onClick }) => (
 <button
 type="button"
 onClick={onClick}
 className="flex h-10 w-10 items-center justify-center border border-[var(--border-visible)] text-[var(--text-disabled)] transition-colors hover:text-[var(--text-primary)] rounded-lg md:hidden"
 aria-label="Abrir menu"
 >
 <Menu size={18} />
 </button>
);

export default MobileMenu;
