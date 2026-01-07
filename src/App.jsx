import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp
} from 'firebase/firestore';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line, AreaChart, Area
} from 'recharts';
import {
  LayoutDashboard,
  ArrowUpCircle,
  ArrowDownCircle,
  Wallet,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Filter,
  Users,
  Briefcase,
  Menu,
  X,
  Download,
  Search,
  Edit2,
  MessageSquare,
  AlertTriangle,
  TrendingUp,
  LogOut,
  FileText,
  DollarSign,
  Calendar,
  Clock
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = import.meta.env.VITE_FIREBASE_APP_ID || 'default-app-id';

// --- Constants ---
const PROJECTS = [
  "PROY-001 (QFF)",
  "PROY-002 (QDU)",
  "PROY-003 (FBX)",
  "PROY-004 (NE4)",
  "PROY-005 (Austria)",
  "General / Overhead"
];

const CATEGORIES = [
  "Subcontractors",
  "Materials",
  "Equipment Rental",
  "Transport/Fuel",
  "Administrative",
  "Salaries",
  "Other"
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

const ADMIN_EMAIL = 'jromero@umtelkomd.com';
const EDITOR_EMAIL = 'beatriz@umtelkomd.com';

const ALERT_THRESHOLDS = {
  overdueDays: 15,
  cxpLimit: 15000,
  cxcLimit: 15000
};

// --- Utility Functions ---
const formatCurrency = (amount) => {
  return `${Number(amount).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const getDaysOverdue = (dateString) => {
  const transactionDate = new Date(dateString);
  const today = new Date();
  const diffTime = today - transactionDate;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// --- Components ---

const Card = ({ title, amount, icon: Icon, colorClass, subtext, alert }) => (
  <div className={`bg-white p-6 rounded-xl shadow-sm border ${alert ? 'border-rose-300 ring-2 ring-rose-200' : 'border-slate-100'} flex items-center justify-between relative overflow-hidden`}>
    {alert && (
      <div className="absolute top-2 right-2">
        <AlertTriangle className="w-5 h-5 text-rose-500" />
      </div>
    )}
    <div className="flex-1">
      <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
      <h3 className={`text-2xl font-bold ${amount < 0 ? 'text-rose-600' : 'text-slate-800'}`}>
        {formatCurrency(amount)}
      </h3>
      {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
    </div>
    <div className={`p-3 rounded-full ${colorClass}`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
  </div>
);

const TransactionRow = ({ t, onToggleStatus, onDelete, onEdit, onViewNotes, userRole, searchTerm }) => {
  const isOverdue = t.status === 'pending' && getDaysOverdue(t.date) > ALERT_THRESHOLDS.overdueDays;

  const highlightText = (text) => {
    if (!searchTerm) return text;
    const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === searchTerm.toLowerCase() ?
        <mark key={i} className="bg-yellow-200">{part}</mark> : part
    );
  };

  return (
    <tr className={`hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 ${isOverdue ? 'bg-rose-50' : ''}`}>
      <td className="px-4 py-3 text-sm text-slate-600">{formatDate(t.date)}</td>
      <td className="px-4 py-3">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-slate-800">{highlightText(t.description)}</span>
          <span className="text-xs text-slate-400">{t.project}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-slate-600 hidden md:table-cell">{t.category}</td>
      <td className="px-4 py-3 text-right">
        <span className={`text-sm font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
          {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        <button
          onClick={() => onToggleStatus(t)}
          disabled={userRole === 'editor'}
          className={`flex items-center justify-center w-full gap-1 text-xs px-2 py-1 rounded-full transition-colors ${
            t.status === 'paid'
              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
              : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
          } ${userRole === 'editor' ? 'opacity-50 cursor-not-allowed' : ''} ${isOverdue ? 'ring-2 ring-rose-400' : ''}`}
        >
          {t.status === 'paid' ? <CheckCircle2 size={14} /> : <Circle size={14} />}
          {t.status === 'paid' ? 'Pagado' : isOverdue ? `Vencido (${getDaysOverdue(t.date)}d)` : 'Pendiente'}
        </button>
      </td>
      <td className="px-4 py-3 text-center">
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => onViewNotes(t)}
            className="text-slate-400 hover:text-blue-500 transition-colors"
            title="Ver notas"
          >
            <MessageSquare size={16} />
          </button>
          <button
            onClick={() => onEdit(t)}
            className="text-slate-400 hover:text-blue-500 transition-colors"
            title="Editar"
          >
            <Edit2 size={16} />
          </button>
          {userRole === 'admin' && (
            <button
              onClick={() => onDelete(t.id)}
              className="text-slate-400 hover:text-rose-500 transition-colors"
              title="Eliminar"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};

const FilterPanel = ({ filters, setFilters, onApply }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 space-y-4">
    <div className="flex items-center justify-between">
      <h3 className="font-bold text-slate-800 flex items-center gap-2">
        <Filter size={18} /> Filtros
      </h3>
      <button
        onClick={() => {
          setFilters({
            dateFrom: '',
            dateTo: '',
            project: '',
            category: '',
            type: '',
            status: '',
            quickFilter: 'all'
          });
          onApply();
        }}
        className="text-sm text-blue-600 hover:text-blue-700"
      >
        Limpiar filtros
      </button>
    </div>

    {/* Quick Filters */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      <button
        onClick={() => setFilters(prev => ({ ...prev, quickFilter: 'month' }))}
        className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
          filters.quickFilter === 'month'
            ? 'bg-blue-50 border-blue-500 text-blue-700'
            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
        }`}
      >
        Este mes
      </button>
      <button
        onClick={() => setFilters(prev => ({ ...prev, quickFilter: 'quarter' }))}
        className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
          filters.quickFilter === 'quarter'
            ? 'bg-blue-50 border-blue-500 text-blue-700'
            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
        }`}
      >
        Trimestre
      </button>
      <button
        onClick={() => setFilters(prev => ({ ...prev, quickFilter: 'year' }))}
        className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
          filters.quickFilter === 'year'
            ? 'bg-blue-50 border-blue-500 text-blue-700'
            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
        }`}
      >
        Este ano
      </button>
      <button
        onClick={() => setFilters(prev => ({ ...prev, quickFilter: 'all' }))}
        className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
          filters.quickFilter === 'all'
            ? 'bg-blue-50 border-blue-500 text-blue-700'
            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
        }`}
      >
        Todo
      </button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1">Desde</label>
        <input
          type="date"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
          value={filters.dateFrom}
          onChange={e => setFilters({...filters, dateFrom: e.target.value})}
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1">Hasta</label>
        <input
          type="date"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
          value={filters.dateTo}
          onChange={e => setFilters({...filters, dateTo: e.target.value})}
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1">Proyecto</label>
        <select
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
          value={filters.project}
          onChange={e => setFilters({...filters, project: e.target.value})}
        >
          <option value="">Todos</option>
          {PROJECTS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1">Categoria</label>
        <select
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
          value={filters.category}
          onChange={e => setFilters({...filters, category: e.target.value})}
        >
          <option value="">Todas</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1">Tipo</label>
        <select
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
          value={filters.type}
          onChange={e => setFilters({...filters, type: e.target.value})}
        >
          <option value="">Todos</option>
          <option value="income">Ingresos</option>
          <option value="expense">Gastos</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1">Estado</label>
        <select
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
          value={filters.status}
          onChange={e => setFilters({...filters, status: e.target.value})}
        >
          <option value="">Todos</option>
          <option value="paid">Pagados</option>
          <option value="pending">Pendientes</option>
        </select>
      </div>
    </div>

    <button
      onClick={onApply}
      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors"
    >
      Aplicar Filtros
    </button>
  </div>
);

// --- Main App Component ---

export default function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [reportMonth, setReportMonth] = useState(new Date().toISOString().slice(0, 7));

  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');

  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    project: '',
    category: '',
    type: '',
    status: '',
    quickFilter: 'all'
  });

  const [appliedFilters, setAppliedFilters] = useState({...filters});

  // Form State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    type: 'expense',
    category: 'Materials',
    project: PROJECTS[0],
    status: 'pending',
    notes: []
  });

  // --- Auth ---

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setIsLoginOpen(false);
        if (currentUser.email === ADMIN_EMAIL) {
          setUserRole('admin');
        } else {
          setUserRole('editor');
        }
      } else {
        setUser(null);
        setUserRole(null);
        setIsLoginOpen(true);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      await signInWithEmailAndPassword(auth, loginData.email, loginData.password);
    } catch (error) {
      setLoginError('Email o contrasena incorrectos');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setView('dashboard');
    } catch (error) {
      console.error('Error al cerrar sesion:', error);
    }
  };

  // --- Data Fetching ---

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'transactions'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        notes: doc.data().notes || []
      }));
      data.sort((a, b) => new Date(b.date) - new Date(a.date));
      setTransactions(data);
      setLoading(false);
    }, (error) => {
      console.error("Firestore error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // --- Apply Quick Filters ---
  useEffect(() => {
    const today = new Date();
    let dateFrom = '';
    let dateTo = '';

    switch (filters.quickFilter) {
      case 'month':
        dateFrom = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        dateTo = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
        break;
      case 'quarter':
        const quarter = Math.floor(today.getMonth() / 3);
        dateFrom = new Date(today.getFullYear(), quarter * 3, 1).toISOString().split('T')[0];
        dateTo = new Date(today.getFullYear(), quarter * 3 + 3, 0).toISOString().split('T')[0];
        break;
      case 'year':
        dateFrom = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
        dateTo = new Date(today.getFullYear(), 11, 31).toISOString().split('T')[0];
        break;
      default:
        dateFrom = '';
        dateTo = '';
    }

    setFilters(prev => ({ ...prev, dateFrom, dateTo }));
  }, [filters.quickFilter]);

  // --- Actions ---

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!user || !formData.amount || !formData.description) return;

    try {
      const transactionData = {
        ...formData,
        amount: parseFloat(formData.amount),
        notes: [{
          text: `Transaccion creada por ${user.email}`,
          timestamp: new Date().toISOString(),
          user: user.email
        }],
        createdAt: serverTimestamp()
      };

      if (editingTransaction) {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'transactions', editingTransaction.id), {
          ...transactionData,
          notes: [
            ...editingTransaction.notes,
            {
              text: `Transaccion editada por ${user.email}`,
              timestamp: new Date().toISOString(),
              user: user.email
            }
          ]
        });
        setEditingTransaction(null);
      } else {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'transactions'), transactionData);
      }

      setIsModalOpen(false);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        description: '',
        amount: '',
        type: 'expense',
        category: 'Materials',
        project: PROJECTS[0],
        status: 'pending',
        notes: []
      });
    } catch (err) {
      console.error("Error guardando transaccion:", err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Estas seguro de eliminar esta transaccion?')) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'transactions', id));
    } catch (err) {
      console.error("Error eliminando:", err);
    }
  };

  const handleToggleStatus = async (t) => {
    if (userRole !== 'admin') return;
    try {
      const newStatus = t.status === 'paid' ? 'pending' : 'paid';
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'transactions', t.id), {
        status: newStatus,
        notes: [
          ...t.notes,
          {
            text: `Estado cambiado a ${newStatus === 'paid' ? 'Pagado' : 'Pendiente'} por ${user.email}`,
            timestamp: new Date().toISOString(),
            user: user.email
          }
        ]
      });
    } catch (err) {
      console.error("Error actualizando estado:", err);
    }
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      date: transaction.date,
      description: transaction.description,
      amount: transaction.amount,
      type: transaction.type,
      category: transaction.category,
      project: transaction.project,
      status: transaction.status,
      notes: transaction.notes || []
    });
    setIsModalOpen(true);
  };

  const handleViewNotes = (transaction) => {
    setSelectedTransaction(transaction);
    setIsNotesModalOpen(true);
    setNewNote('');
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !selectedTransaction) return;

    try {
      const updatedNotes = [
        ...selectedTransaction.notes,
        {
          text: newNote,
          timestamp: new Date().toISOString(),
          user: user.email
        }
      ];

      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'transactions', selectedTransaction.id), {
        notes: updatedNotes
      });

      setNewNote('');
      setSelectedTransaction({...selectedTransaction, notes: updatedNotes});
    } catch (err) {
      console.error("Error agregando nota:", err);
    }
  };

  // --- Filtered Transactions ---

  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    if (searchTerm) {
      filtered = filtered.filter(t =>
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.project.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (appliedFilters.dateFrom) {
      filtered = filtered.filter(t => t.date >= appliedFilters.dateFrom);
    }
    if (appliedFilters.dateTo) {
      filtered = filtered.filter(t => t.date <= appliedFilters.dateTo);
    }
    if (appliedFilters.project) {
      filtered = filtered.filter(t => t.project === appliedFilters.project);
    }
    if (appliedFilters.category) {
      filtered = filtered.filter(t => t.category === appliedFilters.category);
    }
    if (appliedFilters.type) {
      filtered = filtered.filter(t => t.type === appliedFilters.type);
    }
    if (appliedFilters.status) {
      filtered = filtered.filter(t => t.status === appliedFilters.status);
    }

    return filtered;
  }, [transactions, appliedFilters, searchTerm]);

  // --- Metrics ---

  const metrics = useMemo(() => {
    const totalIncome = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const pendingPayables = filteredTransactions
      .filter(t => t.type === 'expense' && t.status === 'pending')
      .reduce((sum, t) => sum + t.amount, 0);

    const pendingReceivables = filteredTransactions
      .filter(t => t.type === 'income' && t.status === 'pending')
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyData = {};
    filteredTransactions.forEach(t => {
      const month = t.date.substring(0, 7);
      if (!monthlyData[month]) {
        monthlyData[month] = { month, ingresos: 0, gastos: 0 };
      }
      if (t.type === 'income') {
        monthlyData[month].ingresos += t.amount;
      } else {
        monthlyData[month].gastos += t.amount;
      }
    });
    const monthlyTrend = Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));

    const categoryData = {};
    filteredTransactions.filter(t => t.type === 'expense').forEach(t => {
      if (!categoryData[t.category]) {
        categoryData[t.category] = 0;
      }
      categoryData[t.category] += t.amount;
    });
    const categoryDistribution = Object.entries(categoryData).map(([name, value]) => ({ name, value }));

    const projectData = {};
    filteredTransactions.forEach(t => {
      const pName = t.project.split(' ')[0];
      if (!projectData[pName]) {
        projectData[pName] = { name: pName, ingresos: 0, gastos: 0, margen: 0 };
      }
      if (t.type === 'income') {
        projectData[pName].ingresos += t.amount;
      } else {
        projectData[pName].gastos += t.amount;
      }
    });
    Object.values(projectData).forEach(p => {
      p.margen = ((p.ingresos - p.gastos) / p.ingresos * 100) || 0;
    });
    const projectMargins = Object.values(projectData);

    const cashFlowData = [];
    let cumulative = 0;
    const sortedByDate = [...filteredTransactions].sort((a, b) => a.date.localeCompare(b.date));
    sortedByDate.forEach(t => {
      if (t.type === 'income') {
        cumulative += t.amount;
      } else {
        cumulative -= t.amount;
      }
      cashFlowData.push({
        date: t.date,
        flujo: cumulative
      });
    });

    const debtComparison = [
      { name: 'CXC', valor: pendingReceivables },
      { name: 'CXP', valor: pendingPayables }
    ];

    const overdueTransactions = filteredTransactions.filter(t =>
      t.status === 'pending' && getDaysOverdue(t.date) > ALERT_THRESHOLDS.overdueDays
    );

    const negativeProjects = projectMargins.filter(p => p.ingresos > 0 && p.gastos > p.ingresos);

    return {
      totalIncome,
      totalExpenses,
      netBalance: totalIncome - totalExpenses,
      pendingPayables,
      pendingReceivables,
      monthlyTrend,
      categoryDistribution,
      projectMargins,
      cashFlowData,
      debtComparison,
      overdueTransactions,
      negativeProjects,
      alerts: {
        negativeBalance: (totalIncome - totalExpenses) < 0,
        highCXP: pendingPayables > ALERT_THRESHOLDS.cxpLimit,
        highCXC: pendingReceivables > ALERT_THRESHOLDS.cxcLimit,
        hasOverdue: overdueTransactions.length > 0,
        hasNegativeProjects: negativeProjects.length > 0
      }
    };
  }, [filteredTransactions]);

  // --- PDF Export ---

  const exportToPDF = () => {
    const doc = new jsPDF();

    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.text('UMTELKOMD GmbH', 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text('Reporte Financiero', 105, 30, { align: 'center' });

    doc.setTextColor(100, 100, 100);
    doc.setFontSize(9);
    doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES')}`, 105, 36, { align: 'center' });

    let yPos = 50;

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('Resumen Ejecutivo', 14, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');

    const metricsData = [
      ['Balance Neto', formatCurrency(metrics.netBalance), metrics.alerts.negativeBalance ? '#fee2e2' : '#f0fdf4'],
      ['Total Ingresos', formatCurrency(metrics.totalIncome), '#f0fdf4'],
      ['Total Gastos', formatCurrency(metrics.totalExpenses), '#fee2e2'],
      ['CXC Pendientes', formatCurrency(metrics.pendingReceivables), metrics.alerts.highCXC ? '#fef3c7' : '#f3f4f6'],
      ['CXP Pendientes', formatCurrency(metrics.pendingPayables), metrics.alerts.highCXP ? '#fef3c7' : '#f3f4f6']
    ];

    metricsData.forEach((metric, i) => {
      const xPos = 14 + (i % 2) * 95;
      const yOffset = Math.floor(i / 2) * 20;

      doc.setFillColor(metric[2] === '#fee2e2' ? 254 : metric[2] === '#f0fdf4' ? 240 : metric[2] === '#fef3c7' ? 254 : 243,
                        metric[2] === '#fee2e2' ? 226 : metric[2] === '#f0fdf4' ? 253 : metric[2] === '#fef3c7' ? 243 : 244,
                        metric[2] === '#fee2e2' ? 226 : metric[2] === '#f0fdf4' ? 244 : metric[2] === '#fef3c7' ? 199 : 246);
      doc.roundedRect(xPos, yPos + yOffset, 90, 16, 2, 2, 'F');
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(8);
      doc.text(metric[0], xPos + 4, yPos + yOffset + 6);
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text(metric[1], xPos + 4, yPos + yOffset + 13);
      doc.setFont(undefined, 'normal');
    });

    yPos += 55;

    if (Object.values(metrics.alerts).some(a => a)) {
      doc.setFillColor(254, 226, 226);
      doc.roundedRect(14, yPos, 182, 8 + (Object.values(metrics.alerts).filter(a => a).length * 5), 2, 2, 'F');
      doc.setTextColor(185, 28, 28);
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text('Alertas', 18, yPos + 5);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(8);
      let alertY = yPos + 10;

      if (metrics.alerts.negativeBalance) {
        doc.text('Balance general negativo', 18, alertY);
        alertY += 5;
      }
      if (metrics.alerts.highCXP) {
        doc.text(`CXP supera el limite de ${formatCurrency(ALERT_THRESHOLDS.cxpLimit)}`, 18, alertY);
        alertY += 5;
      }
      if (metrics.alerts.highCXC) {
        doc.text(`CXC supera el limite de ${formatCurrency(ALERT_THRESHOLDS.cxcLimit)}`, 18, alertY);
        alertY += 5;
      }
      if (metrics.alerts.hasOverdue) {
        doc.text(`${metrics.overdueTransactions.length} factura(s) vencida(s) (>${ALERT_THRESHOLDS.overdueDays} dias)`, 18, alertY);
        alertY += 5;
      }
      if (metrics.alerts.hasNegativeProjects) {
        doc.text(`${metrics.negativeProjects.length} proyecto(s) con gastos mayores a ingresos`, 18, alertY);
        alertY += 5;
      }

      yPos = alertY + 5;
    }

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Transacciones Filtradas', 14, yPos);
    yPos += 5;

    const tableData = filteredTransactions.map(t => [
      formatDate(t.date),
      t.description,
      t.project.split(' ')[0],
      t.category,
      t.type === 'income' ? 'Ingreso' : 'Gasto',
      formatCurrency(t.amount),
      t.status === 'paid' ? 'Pagado' : 'Pendiente'
    ]);

    doc.autoTable({
      startY: yPos,
      head: [['Fecha', 'Descripcion', 'Proyecto', 'Categoria', 'Tipo', 'Monto', 'Estado']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 7 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 45 },
        2: { cellWidth: 25 },
        3: { cellWidth: 25 },
        4: { cellWidth: 20 },
        5: { cellWidth: 25, halign: 'right' },
        6: { cellWidth: 22 }
      },
      margin: { left: 14, right: 14 }
    });

    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Pagina ${i} de ${pageCount}`, 105, 287, { align: 'center' });
      doc.text('UMTELKOMD GmbH - Confidencial', 14, 287);
    }

    doc.save(`UMTELKOMD_Reporte_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // --- Views ---

  const renderDashboard = () => (
    <div className="space-y-6">
      {Object.values(metrics.alerts).some(a => a) && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-lg">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-rose-500 mt-0.5" />
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-bold text-rose-800">Alertas del Sistema</h3>
              <ul className="mt-2 text-sm text-rose-700 space-y-1">
                {metrics.alerts.negativeBalance && <li>Balance general negativo</li>}
                {metrics.alerts.highCXP && <li>Cuentas por Pagar superan {formatCurrency(ALERT_THRESHOLDS.cxpLimit)}</li>}
                {metrics.alerts.highCXC && <li>Cuentas por Cobrar superan {formatCurrency(ALERT_THRESHOLDS.cxcLimit)}</li>}
                {metrics.alerts.hasOverdue && <li>{metrics.overdueTransactions.length} factura(s) vencida(s) mas de {ALERT_THRESHOLDS.overdueDays} dias</li>}
                {metrics.alerts.hasNegativeProjects && <li>{metrics.negativeProjects.length} proyecto(s) con gastos mayores a ingresos</li>}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          title="Balance Neto"
          amount={metrics.netBalance}
          icon={Wallet}
          colorClass="bg-blue-500"
          alert={metrics.alerts.negativeBalance}
        />
        <Card
          title="Total Ingresos"
          amount={metrics.totalIncome}
          icon={ArrowUpCircle}
          colorClass="bg-emerald-500"
        />
        <Card
          title="Cuentas por Cobrar (CXC)"
          amount={metrics.pendingReceivables}
          icon={Users}
          colorClass="bg-indigo-500"
          subtext="Facturas Pendientes"
          alert={metrics.alerts.highCXC}
        />
        <Card
          title="Cuentas por Pagar (CXP)"
          amount={metrics.pendingPayables}
          icon={ArrowDownCircle}
          colorClass="bg-rose-500"
          subtext="Cuentas Pendientes"
          alert={metrics.alerts.highCXP}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <TrendingUp size={20} /> Tendencia Mensual
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Line type="monotone" dataKey="ingresos" stroke="#10b981" strokeWidth={2} name="Ingresos" />
                <Line type="monotone" dataKey="gastos" stroke="#f43f5e" strokeWidth={2} name="Gastos" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Distribucion de Gastos por Categoria</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metrics.categoryDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {metrics.categoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Margenes por Proyecto</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.projectMargins}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="ingresos" fill="#10b981" name="Ingresos" radius={[4, 4, 0, 0]} />
                <Bar dataKey="gastos" fill="#f43f5e" name="Gastos" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4">CXC vs CXP Pendientes</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.debtComparison} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Bar dataKey="valor" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                  {metrics.debtComparison.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.name === 'CXC' ? '#6366f1' : '#f43f5e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Evolucion del Flujo de Caja</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={metrics.cashFlowData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Area type="monotone" dataKey="flujo" stroke="#3b82f6" fill="#93c5fd" name="Flujo Acumulado" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Actividad Reciente</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-xs text-slate-400 border-b border-slate-100">
                <th className="py-2 px-2">Fecha</th>
                <th className="py-2 px-2">Descripcion</th>
                <th className="py-2 px-2">Proyecto</th>
                <th className="py-2 px-2 text-right">Monto</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.slice(0, 10).map(t => (
                <tr key={t.id} className="border-b border-slate-50 last:border-0">
                  <td className="py-3 px-2 text-sm text-slate-500">{formatDate(t.date)}</td>
                  <td className="py-3 px-2 text-sm text-slate-700">{t.description}</td>
                  <td className="py-3 px-2 text-sm text-slate-500">{t.project.split(' ')[0]}</td>
                  <td className={`py-3 px-2 text-sm text-right font-medium ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {formatCurrency(t.amount)}
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center py-4 text-slate-400 text-sm">No hay transacciones.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderTable = (filterFn) => (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full md:w-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar transacciones..."
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
          >
            <Filter size={18} /> Filtros
          </button>
          {userRole === 'admin' && (
            <button
              onClick={exportToPDF}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Download size={18} /> Exportar PDF
            </button>
          )}
        </div>
      </div>

      {showFilters && (
        <FilterPanel
          filters={filters}
          setFilters={setFilters}
          onApply={() => {
            setAppliedFilters({...filters});
            setShowFilters(false);
          }}
        />
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Fecha</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Descripcion</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Categoria</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Monto</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Estado</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.filter(filterFn).map(t => (
                <TransactionRow
                  key={t.id}
                  t={t}
                  onToggleStatus={handleToggleStatus}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                  onViewNotes={handleViewNotes}
                  userRole={userRole}
                  searchTerm={searchTerm}
                />
              ))}
              {filteredTransactions.filter(filterFn).length === 0 && (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-slate-400">
                    No se encontraron registros que coincidan con los filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // --- P&L Report (Estado de Resultados) ---
  const renderPnL = () => {
    const monthTransactions = transactions.filter(t => t.date.startsWith(reportMonth));

    const incomeByCategory = {};
    const expenseByCategory = {};

    monthTransactions.forEach(t => {
      if (t.type === 'income') {
        incomeByCategory[t.category] = (incomeByCategory[t.category] || 0) + t.amount;
      } else {
        expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
      }
    });

    const totalIncome = Object.values(incomeByCategory).reduce((sum, v) => sum + v, 0);
    const totalExpenses = Object.values(expenseByCategory).reduce((sum, v) => sum + v, 0);
    const netIncome = totalIncome - totalExpenses;

    const incomeData = Object.entries(incomeByCategory).map(([name, value]) => ({ name, value }));
    const expenseData = Object.entries(expenseByCategory).map(([name, value]) => ({ name, value }));

    const monthName = new Date(reportMonth + '-01').toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar size={20} className="text-slate-500" />
            <select
              value={reportMonth}
              onChange={(e) => setReportMonth(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {Array.from({ length: 12 }, (_, i) => {
                const date = new Date();
                date.setMonth(date.getMonth() - i);
                const value = date.toISOString().slice(0, 7);
                const label = date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
                return <option key={value} value={value}>{label}</option>;
              })}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-200">
            <p className="text-sm font-medium text-emerald-600 mb-1">Total Ingresos</p>
            <h3 className="text-2xl font-bold text-emerald-700">{formatCurrency(totalIncome)}</h3>
          </div>
          <div className="bg-rose-50 p-6 rounded-xl border border-rose-200">
            <p className="text-sm font-medium text-rose-600 mb-1">Total Gastos</p>
            <h3 className="text-2xl font-bold text-rose-700">{formatCurrency(totalExpenses)}</h3>
          </div>
          <div className={`p-6 rounded-xl border ${netIncome >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-amber-50 border-amber-200'}`}>
            <p className={`text-sm font-medium mb-1 ${netIncome >= 0 ? 'text-blue-600' : 'text-amber-600'}`}>Resultado Neto</p>
            <h3 className={`text-2xl font-bold ${netIncome >= 0 ? 'text-blue-700' : 'text-amber-700'}`}>{formatCurrency(netIncome)}</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-emerald-700 mb-4">Ingresos por Categoria</h3>
            {incomeData.length > 0 ? (
              <>
                <div className="h-48 mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={incomeData} cx="50%" cy="50%" outerRadius={70} fill="#10b981" dataKey="value" label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}>
                        {incomeData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <table className="w-full text-sm">
                  <tbody>
                    {incomeData.map((item, idx) => (
                      <tr key={idx} className="border-b border-slate-100 last:border-0">
                        <td className="py-2 text-slate-600">{item.name}</td>
                        <td className="py-2 text-right font-medium text-emerald-600">{formatCurrency(item.value)}</td>
                      </tr>
                    ))}
                    <tr className="font-bold">
                      <td className="py-2 text-slate-800">Total</td>
                      <td className="py-2 text-right text-emerald-700">{formatCurrency(totalIncome)}</td>
                    </tr>
                  </tbody>
                </table>
              </>
            ) : (
              <p className="text-slate-400 text-center py-8">Sin ingresos en este periodo</p>
            )}
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-rose-700 mb-4">Gastos por Categoria</h3>
            {expenseData.length > 0 ? (
              <>
                <div className="h-48 mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={expenseData} cx="50%" cy="50%" outerRadius={70} fill="#f43f5e" dataKey="value" label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}>
                        {expenseData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <table className="w-full text-sm">
                  <tbody>
                    {expenseData.map((item, idx) => (
                      <tr key={idx} className="border-b border-slate-100 last:border-0">
                        <td className="py-2 text-slate-600">{item.name}</td>
                        <td className="py-2 text-right font-medium text-rose-600">{formatCurrency(item.value)}</td>
                      </tr>
                    ))}
                    <tr className="font-bold">
                      <td className="py-2 text-slate-800">Total</td>
                      <td className="py-2 text-right text-rose-700">{formatCurrency(totalExpenses)}</td>
                    </tr>
                  </tbody>
                </table>
              </>
            ) : (
              <p className="text-slate-400 text-center py-8">Sin gastos en este periodo</p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Resumen del Estado de Resultados - {monthName}</h3>
          <table className="w-full">
            <tbody>
              <tr className="border-b-2 border-emerald-200 bg-emerald-50">
                <td className="py-3 px-4 font-bold text-emerald-700" colSpan={2}>INGRESOS</td>
              </tr>
              {incomeData.map((item, idx) => (
                <tr key={`inc-${idx}`} className="border-b border-slate-100">
                  <td className="py-2 px-4 text-slate-600 pl-8">{item.name}</td>
                  <td className="py-2 px-4 text-right font-medium text-slate-700">{formatCurrency(item.value)}</td>
                </tr>
              ))}
              <tr className="border-b-2 border-slate-300 bg-slate-50">
                <td className="py-3 px-4 font-bold text-slate-800">Total Ingresos</td>
                <td className="py-3 px-4 text-right font-bold text-emerald-600">{formatCurrency(totalIncome)}</td>
              </tr>

              <tr className="border-b-2 border-rose-200 bg-rose-50">
                <td className="py-3 px-4 font-bold text-rose-700" colSpan={2}>GASTOS</td>
              </tr>
              {expenseData.map((item, idx) => (
                <tr key={`exp-${idx}`} className="border-b border-slate-100">
                  <td className="py-2 px-4 text-slate-600 pl-8">{item.name}</td>
                  <td className="py-2 px-4 text-right font-medium text-slate-700">{formatCurrency(item.value)}</td>
                </tr>
              ))}
              <tr className="border-b-2 border-slate-300 bg-slate-50">
                <td className="py-3 px-4 font-bold text-slate-800">Total Gastos</td>
                <td className="py-3 px-4 text-right font-bold text-rose-600">{formatCurrency(totalExpenses)}</td>
              </tr>

              <tr className={`${netIncome >= 0 ? 'bg-blue-100' : 'bg-amber-100'}`}>
                <td className="py-4 px-4 font-bold text-lg text-slate-800">RESULTADO NETO</td>
                <td className={`py-4 px-4 text-right font-bold text-lg ${netIncome >= 0 ? 'text-blue-700' : 'text-amber-700'}`}>
                  {formatCurrency(netIncome)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // --- CXP Report (Cuentas por Pagar) ---
  const renderCXPReport = () => {
    const pendingPayables = transactions.filter(t => t.type === 'expense' && t.status === 'pending');

    const aging = {
      current: pendingPayables.filter(t => getDaysOverdue(t.date) <= 30),
      days31_60: pendingPayables.filter(t => getDaysOverdue(t.date) > 30 && getDaysOverdue(t.date) <= 60),
      days61_90: pendingPayables.filter(t => getDaysOverdue(t.date) > 60 && getDaysOverdue(t.date) <= 90),
      over90: pendingPayables.filter(t => getDaysOverdue(t.date) > 90)
    };

    const agingData = [
      { name: '0-30 dias', value: aging.current.reduce((s, t) => s + t.amount, 0), count: aging.current.length },
      { name: '31-60 dias', value: aging.days31_60.reduce((s, t) => s + t.amount, 0), count: aging.days31_60.length },
      { name: '61-90 dias', value: aging.days61_90.reduce((s, t) => s + t.amount, 0), count: aging.days61_90.length },
      { name: '90+ dias', value: aging.over90.reduce((s, t) => s + t.amount, 0), count: aging.over90.length }
    ];

    const totalPending = pendingPayables.reduce((s, t) => s + t.amount, 0);
    const overdueAmount = [...aging.days31_60, ...aging.days61_90, ...aging.over90].reduce((s, t) => s + t.amount, 0);

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <p className="text-sm font-medium text-slate-500 mb-1">Total Pendiente</p>
            <h3 className="text-2xl font-bold text-rose-600">{formatCurrency(totalPending)}</h3>
            <p className="text-xs text-slate-400 mt-1">{pendingPayables.length} facturas</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <p className="text-sm font-medium text-slate-500 mb-1">Monto Vencido</p>
            <h3 className="text-2xl font-bold text-amber-600">{formatCurrency(overdueAmount)}</h3>
            <p className="text-xs text-slate-400 mt-1">{aging.days31_60.length + aging.days61_90.length + aging.over90.length} facturas</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <p className="text-sm font-medium text-slate-500 mb-1">Critico (90+ dias)</p>
            <h3 className="text-2xl font-bold text-red-600">{formatCurrency(agingData[3].value)}</h3>
            <p className="text-xs text-slate-400 mt-1">{aging.over90.length} facturas</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <p className="text-sm font-medium text-slate-500 mb-1">Al Corriente</p>
            <h3 className="text-2xl font-bold text-emerald-600">{formatCurrency(agingData[0].value)}</h3>
            <p className="text-xs text-slate-400 mt-1">{aging.current.length} facturas</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Analisis de Antiguedad</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={agingData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="value" fill="#f43f5e" radius={[4, 4, 0, 0]}>
                    {agingData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={['#10b981', '#fbbf24', '#f97316', '#ef4444'][index]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Resumen por Antiguedad</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-2 text-left text-slate-500">Periodo</th>
                  <th className="py-2 text-right text-slate-500">Facturas</th>
                  <th className="py-2 text-right text-slate-500">Monto</th>
                </tr>
              </thead>
              <tbody>
                {agingData.map((item, idx) => (
                  <tr key={idx} className="border-b border-slate-100">
                    <td className="py-3 text-slate-700">{item.name}</td>
                    <td className="py-3 text-right text-slate-600">{item.count}</td>
                    <td className="py-3 text-right font-medium text-slate-800">{formatCurrency(item.value)}</td>
                  </tr>
                ))}
                <tr className="font-bold bg-slate-50">
                  <td className="py-3 text-slate-800">Total</td>
                  <td className="py-3 text-right text-slate-700">{pendingPayables.length}</td>
                  <td className="py-3 text-right text-rose-600">{formatCurrency(totalPending)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-800">Detalle de Cuentas por Pagar</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Fecha</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Descripcion</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Proyecto</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Categoria</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Monto</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase text-center">Dias</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingPayables.sort((a, b) => getDaysOverdue(b.date) - getDaysOverdue(a.date)).map(t => {
                  const days = getDaysOverdue(t.date);
                  return (
                    <tr key={t.id} className={`hover:bg-slate-50 ${days > 90 ? 'bg-red-50' : days > 30 ? 'bg-amber-50' : ''}`}>
                      <td className="px-4 py-3 text-sm text-slate-600">{formatDate(t.date)}</td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-800">{t.description}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{t.project.split(' ')[0]}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{t.category}</td>
                      <td className="px-4 py-3 text-sm font-bold text-rose-600 text-right">{formatCurrency(t.amount)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          days > 90 ? 'bg-red-100 text-red-700' :
                          days > 60 ? 'bg-orange-100 text-orange-700' :
                          days > 30 ? 'bg-amber-100 text-amber-700' :
                          'bg-emerald-100 text-emerald-700'
                        }`}>
                          {days} dias
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {pendingPayables.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-slate-400">No hay cuentas por pagar pendientes</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // --- CXC Report (Cuentas por Cobrar) ---
  const renderCXCReport = () => {
    const pendingReceivables = transactions.filter(t => t.type === 'income' && t.status === 'pending');

    const aging = {
      current: pendingReceivables.filter(t => getDaysOverdue(t.date) <= 30),
      days31_60: pendingReceivables.filter(t => getDaysOverdue(t.date) > 30 && getDaysOverdue(t.date) <= 60),
      days61_90: pendingReceivables.filter(t => getDaysOverdue(t.date) > 60 && getDaysOverdue(t.date) <= 90),
      over90: pendingReceivables.filter(t => getDaysOverdue(t.date) > 90)
    };

    const agingData = [
      { name: '0-30 dias', value: aging.current.reduce((s, t) => s + t.amount, 0), count: aging.current.length },
      { name: '31-60 dias', value: aging.days31_60.reduce((s, t) => s + t.amount, 0), count: aging.days31_60.length },
      { name: '61-90 dias', value: aging.days61_90.reduce((s, t) => s + t.amount, 0), count: aging.days61_90.length },
      { name: '90+ dias', value: aging.over90.reduce((s, t) => s + t.amount, 0), count: aging.over90.length }
    ];

    const totalPending = pendingReceivables.reduce((s, t) => s + t.amount, 0);
    const overdueAmount = [...aging.days31_60, ...aging.days61_90, ...aging.over90].reduce((s, t) => s + t.amount, 0);

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <p className="text-sm font-medium text-slate-500 mb-1">Total por Cobrar</p>
            <h3 className="text-2xl font-bold text-indigo-600">{formatCurrency(totalPending)}</h3>
            <p className="text-xs text-slate-400 mt-1">{pendingReceivables.length} facturas</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <p className="text-sm font-medium text-slate-500 mb-1">Monto Vencido</p>
            <h3 className="text-2xl font-bold text-amber-600">{formatCurrency(overdueAmount)}</h3>
            <p className="text-xs text-slate-400 mt-1">{aging.days31_60.length + aging.days61_90.length + aging.over90.length} facturas</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <p className="text-sm font-medium text-slate-500 mb-1">Critico (90+ dias)</p>
            <h3 className="text-2xl font-bold text-red-600">{formatCurrency(agingData[3].value)}</h3>
            <p className="text-xs text-slate-400 mt-1">{aging.over90.length} facturas</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <p className="text-sm font-medium text-slate-500 mb-1">Al Corriente</p>
            <h3 className="text-2xl font-bold text-emerald-600">{formatCurrency(agingData[0].value)}</h3>
            <p className="text-xs text-slate-400 mt-1">{aging.current.length} facturas</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Analisis de Antiguedad</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={agingData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]}>
                    {agingData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={['#10b981', '#fbbf24', '#f97316', '#ef4444'][index]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Resumen por Antiguedad</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-2 text-left text-slate-500">Periodo</th>
                  <th className="py-2 text-right text-slate-500">Facturas</th>
                  <th className="py-2 text-right text-slate-500">Monto</th>
                </tr>
              </thead>
              <tbody>
                {agingData.map((item, idx) => (
                  <tr key={idx} className="border-b border-slate-100">
                    <td className="py-3 text-slate-700">{item.name}</td>
                    <td className="py-3 text-right text-slate-600">{item.count}</td>
                    <td className="py-3 text-right font-medium text-slate-800">{formatCurrency(item.value)}</td>
                  </tr>
                ))}
                <tr className="font-bold bg-slate-50">
                  <td className="py-3 text-slate-800">Total</td>
                  <td className="py-3 text-right text-slate-700">{pendingReceivables.length}</td>
                  <td className="py-3 text-right text-indigo-600">{formatCurrency(totalPending)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-800">Detalle de Cuentas por Cobrar</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Fecha</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Descripcion</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Proyecto</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Categoria</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Monto</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase text-center">Dias</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingReceivables.sort((a, b) => getDaysOverdue(b.date) - getDaysOverdue(a.date)).map(t => {
                  const days = getDaysOverdue(t.date);
                  return (
                    <tr key={t.id} className={`hover:bg-slate-50 ${days > 90 ? 'bg-red-50' : days > 30 ? 'bg-amber-50' : ''}`}>
                      <td className="px-4 py-3 text-sm text-slate-600">{formatDate(t.date)}</td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-800">{t.description}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{t.project.split(' ')[0]}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{t.category}</td>
                      <td className="px-4 py-3 text-sm font-bold text-indigo-600 text-right">{formatCurrency(t.amount)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          days > 90 ? 'bg-red-100 text-red-700' :
                          days > 60 ? 'bg-orange-100 text-orange-700' :
                          days > 30 ? 'bg-amber-100 text-amber-700' :
                          'bg-emerald-100 text-emerald-700'
                        }`}>
                          {days} dias
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {pendingReceivables.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-slate-400">No hay cuentas por cobrar pendientes</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // --- Cash Flow Report ---
  const renderCashFlow = () => {
    const monthlyFlowData = {};
    const sortedTransactions = [...transactions].sort((a, b) => a.date.localeCompare(b.date));

    sortedTransactions.forEach(t => {
      const month = t.date.substring(0, 7);
      if (!monthlyFlowData[month]) {
        monthlyFlowData[month] = { month, inflows: 0, outflows: 0, net: 0 };
      }
      if (t.type === 'income' && t.status === 'paid') {
        monthlyFlowData[month].inflows += t.amount;
      } else if (t.type === 'expense' && t.status === 'paid') {
        monthlyFlowData[month].outflows += t.amount;
      }
    });

    Object.values(monthlyFlowData).forEach(m => {
      m.net = m.inflows - m.outflows;
    });

    const monthlyFlow = Object.values(monthlyFlowData).sort((a, b) => a.month.localeCompare(b.month));

    let runningBalance = 0;
    const cumulativeFlow = monthlyFlow.map(m => {
      runningBalance += m.net;
      return { ...m, cumulative: runningBalance };
    });

    const currentMonthData = monthlyFlowData[reportMonth] || { inflows: 0, outflows: 0, net: 0 };
    const totalInflows = cumulativeFlow.reduce((s, m) => s + m.inflows, 0);
    const totalOutflows = cumulativeFlow.reduce((s, m) => s + m.outflows, 0);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar size={20} className="text-slate-500" />
            <select
              value={reportMonth}
              onChange={(e) => setReportMonth(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {Array.from({ length: 12 }, (_, i) => {
                const date = new Date();
                date.setMonth(date.getMonth() - i);
                const value = date.toISOString().slice(0, 7);
                const label = date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
                return <option key={value} value={value}>{label}</option>;
              })}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-200">
            <p className="text-sm font-medium text-emerald-600 mb-1">Entradas del Mes</p>
            <h3 className="text-2xl font-bold text-emerald-700">{formatCurrency(currentMonthData.inflows)}</h3>
          </div>
          <div className="bg-rose-50 p-6 rounded-xl border border-rose-200">
            <p className="text-sm font-medium text-rose-600 mb-1">Salidas del Mes</p>
            <h3 className="text-2xl font-bold text-rose-700">{formatCurrency(currentMonthData.outflows)}</h3>
          </div>
          <div className={`p-6 rounded-xl border ${currentMonthData.net >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-amber-50 border-amber-200'}`}>
            <p className={`text-sm font-medium mb-1 ${currentMonthData.net >= 0 ? 'text-blue-600' : 'text-amber-600'}`}>Flujo Neto del Mes</p>
            <h3 className={`text-2xl font-bold ${currentMonthData.net >= 0 ? 'text-blue-700' : 'text-amber-700'}`}>{formatCurrency(currentMonthData.net)}</h3>
          </div>
          <div className={`p-6 rounded-xl border ${runningBalance >= 0 ? 'bg-indigo-50 border-indigo-200' : 'bg-red-50 border-red-200'}`}>
            <p className={`text-sm font-medium mb-1 ${runningBalance >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>Saldo Acumulado</p>
            <h3 className={`text-2xl font-bold ${runningBalance >= 0 ? 'text-indigo-700' : 'text-red-700'}`}>{formatCurrency(runningBalance)}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Evolucion del Flujo de Caja</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cumulativeFlow}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Area type="monotone" dataKey="cumulative" stroke="#3b82f6" fill="#93c5fd" name="Saldo Acumulado" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Entradas vs Salidas Mensuales</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cumulativeFlow}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="inflows" fill="#10b981" name="Entradas" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="outflows" fill="#f43f5e" name="Salidas" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Flujo Neto Mensual</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cumulativeFlow}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="net" name="Flujo Neto" radius={[4, 4, 0, 0]}>
                    {cumulativeFlow.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.net >= 0 ? '#10b981' : '#f43f5e'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-800">Detalle Mensual de Flujo de Caja</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Mes</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Entradas</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Salidas</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Flujo Neto</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Saldo Acumulado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cumulativeFlow.map((m, idx) => (
                  <tr key={idx} className={`hover:bg-slate-50 ${m.month === reportMonth ? 'bg-blue-50' : ''}`}>
                    <td className="px-4 py-3 text-sm font-medium text-slate-700">
                      {new Date(m.month + '-01').toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-emerald-600 font-medium">{formatCurrency(m.inflows)}</td>
                    <td className="px-4 py-3 text-sm text-right text-rose-600 font-medium">{formatCurrency(m.outflows)}</td>
                    <td className={`px-4 py-3 text-sm text-right font-bold ${m.net >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {formatCurrency(m.net)}
                    </td>
                    <td className={`px-4 py-3 text-sm text-right font-bold ${m.cumulative >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      {formatCurrency(m.cumulative)}
                    </td>
                  </tr>
                ))}
                {cumulativeFlow.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-slate-400">No hay datos de flujo de caja</td>
                  </tr>
                )}
                <tr className="font-bold bg-slate-100">
                  <td className="px-4 py-3 text-slate-800">TOTAL</td>
                  <td className="px-4 py-3 text-right text-emerald-700">{formatCurrency(totalInflows)}</td>
                  <td className="px-4 py-3 text-right text-rose-700">{formatCurrency(totalOutflows)}</td>
                  <td className={`px-4 py-3 text-right ${totalInflows - totalOutflows >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {formatCurrency(totalInflows - totalOutflows)}
                  </td>
                  <td className={`px-4 py-3 text-right ${runningBalance >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                    {formatCurrency(runningBalance)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // --- Login Screen ---

  if (isLoginOpen) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-blue-50 to-indigo-100 items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
          <div className="flex items-center justify-center gap-3 text-blue-600 mb-8">
            <Briefcase size={40} />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">UMTELKOMD</h1>
              <p className="text-sm text-slate-500">Sistema Financiero</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
              <input
                type="email"
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                value={loginData.email}
                onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                placeholder="usuario@umtelkomd.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Contrasena</label>
              <input
                type="password"
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                value={loginData.password}
                onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                placeholder="********"
              />
            </div>

            {loginError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg text-sm">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors shadow-md"
            >
              Iniciar Sesion
            </button>
          </form>

          <p className="text-xs text-slate-400 text-center mt-6">
            Sistema de Gestion Financiera 2025
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      {/* Sidebar - Desktop */}
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

        <nav className="flex-1 p-4 space-y-1">
          {userRole === 'admin' && (
            <button onClick={() => setView('dashboard')} className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors ${view === 'dashboard' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>
              <LayoutDashboard size={18} /> Dashboard
            </button>
          )}
          <button onClick={() => setView('transactions')} className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors ${view === 'transactions' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>
            <Filter size={18} /> Todas las Transacciones
          </button>

          {userRole === 'admin' && (
            <>
              <div className="pt-4 pb-2 px-4 text-xs font-semibold text-slate-400 uppercase">Gestion de Deudas</div>
              <button onClick={() => setView('cxp')} className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors ${view === 'cxp' ? 'bg-rose-50 text-rose-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                <ArrowDownCircle size={18} /> Cuentas por Pagar (CXP)
              </button>
              <button onClick={() => setView('cxc')} className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors ${view === 'cxc' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                <ArrowUpCircle size={18} /> Cuentas por Cobrar (CXC)
              </button>

              <div className="pt-4 pb-2 px-4 text-xs font-semibold text-slate-400 uppercase">Reportes</div>
              <button onClick={() => setView('pnl')} className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors ${view === 'pnl' ? 'bg-purple-50 text-purple-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                <FileText size={18} /> Estado de Resultados
              </button>
              <button onClick={() => setView('cxp-report')} className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors ${view === 'cxp-report' ? 'bg-rose-50 text-rose-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                <Clock size={18} /> Reporte CXP
              </button>
              <button onClick={() => setView('cxc-report')} className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors ${view === 'cxc-report' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                <Clock size={18} /> Reporte CXC
              </button>
              <button onClick={() => setView('cashflow')} className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors ${view === 'cashflow' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                <DollarSign size={18} /> Flujo de Caja
              </button>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-slate-100 space-y-2">
          <button
            onClick={() => {
              setEditingTransaction(null);
              setFormData({
                date: new Date().toISOString().split('T')[0],
                description: '',
                amount: '',
                type: 'expense',
                category: 'Materials',
                project: PROJECTS[0],
                status: 'pending',
                notes: []
              });
              setIsModalOpen(true);
            }}
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

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-20 flex items-center justify-between px-4">
        <div className="flex items-center gap-2 text-blue-600">
          <Briefcase size={24} />
          <h1 className="text-lg font-bold">UMTELKOMD</h1>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-600">
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-10 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="absolute top-16 left-0 right-0 bg-white border-b border-slate-200 p-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <nav className="space-y-1">
              {userRole === 'admin' && (
                <button onClick={() => { setView('dashboard'); setIsMobileMenuOpen(false); }} className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium ${view === 'dashboard' ? 'bg-blue-50 text-blue-700' : 'text-slate-600'}`}>
                  <LayoutDashboard size={18} /> Dashboard
                </button>
              )}
              <button onClick={() => { setView('transactions'); setIsMobileMenuOpen(false); }} className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium ${view === 'transactions' ? 'bg-blue-50 text-blue-700' : 'text-slate-600'}`}>
                <Filter size={18} /> Transacciones
              </button>
              {userRole === 'admin' && (
                <>
                  <button onClick={() => { setView('cxp'); setIsMobileMenuOpen(false); }} className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium ${view === 'cxp' ? 'bg-rose-50 text-rose-700' : 'text-slate-600'}`}>
                    <ArrowDownCircle size={18} /> CXP
                  </button>
                  <button onClick={() => { setView('cxc'); setIsMobileMenuOpen(false); }} className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium ${view === 'cxc' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600'}`}>
                    <ArrowUpCircle size={18} /> CXC
                  </button>
                  <div className="pt-2 pb-1 px-4 text-xs font-semibold text-slate-400 uppercase">Reportes</div>
                  <button onClick={() => { setView('pnl'); setIsMobileMenuOpen(false); }} className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium ${view === 'pnl' ? 'bg-purple-50 text-purple-700' : 'text-slate-600'}`}>
                    <FileText size={18} /> P&L
                  </button>
                  <button onClick={() => { setView('cxp-report'); setIsMobileMenuOpen(false); }} className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium ${view === 'cxp-report' ? 'bg-rose-50 text-rose-700' : 'text-slate-600'}`}>
                    <Clock size={18} /> Rep. CXP
                  </button>
                  <button onClick={() => { setView('cxc-report'); setIsMobileMenuOpen(false); }} className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium ${view === 'cxc-report' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600'}`}>
                    <Clock size={18} /> Rep. CXC
                  </button>
                  <button onClick={() => { setView('cashflow'); setIsMobileMenuOpen(false); }} className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium ${view === 'cashflow' ? 'bg-blue-50 text-blue-700' : 'text-slate-600'}`}>
                    <DollarSign size={18} /> Cash Flow
                  </button>
                </>
              )}
              <button
                onClick={() => { setIsModalOpen(true); setIsMobileMenuOpen(false); }}
                className="mt-4 flex items-center justify-center gap-2 w-full bg-blue-600 text-white px-4 py-3 rounded-lg font-medium"
              >
                <Plus size={18} /> Agregar
              </button>
              <button
                onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                className="flex items-center justify-center gap-2 w-full bg-slate-100 text-slate-700 px-4 py-3 rounded-lg font-medium"
              >
                <LogOut size={18} /> Salir
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 pt-20 md:pt-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-slate-800">
              {view === 'dashboard' && 'Dashboard Financiero'}
              {view === 'transactions' && 'Todas las Transacciones'}
              {view === 'cxp' && 'Cuentas por Pagar (CXP)'}
              {view === 'cxc' && 'Cuentas por Cobrar (CXC)'}
              {view === 'pnl' && 'Estado de Resultados (P&L)'}
              {view === 'cxp-report' && 'Reporte de Cuentas por Pagar'}
              {view === 'cxc-report' && 'Reporte de Cuentas por Cobrar'}
              {view === 'cashflow' && 'Flujo de Caja'}
            </h2>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64 text-slate-400">Cargando datos financieros...</div>
          ) : (
            <>
              {view === 'dashboard' && userRole === 'admin' && renderDashboard()}
              {view === 'transactions' && renderTable(() => true)}
              {view === 'cxp' && userRole === 'admin' && renderTable(t => t.type === 'expense' && t.status === 'pending')}
              {view === 'cxc' && userRole === 'admin' && renderTable(t => t.type === 'income' && t.status === 'pending')}
              {view === 'pnl' && userRole === 'admin' && renderPnL()}
              {view === 'cxp-report' && userRole === 'admin' && renderCXPReport()}
              {view === 'cxc-report' && userRole === 'admin' && renderCXCReport()}
              {view === 'cashflow' && userRole === 'admin' && renderCashFlow()}
            </>
          )}
        </div>
      </main>

      {/* Add/Edit Transaction Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800">
                {editingTransaction ? 'Editar Transaccion' : 'Nueva Transaccion'}
              </h3>
              <button onClick={() => {
                setIsModalOpen(false);
                setEditingTransaction(null);
              }} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddTransaction} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setFormData({...formData, type: 'income'})}
                  className={`py-2 text-sm font-medium rounded-md transition-all ${formData.type === 'income' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Ingreso
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({...formData, type: 'expense'})}
                  className={`py-2 text-sm font-medium rounded-md transition-all ${formData.type === 'expense' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Gasto
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Fecha</label>
                  <input
                    type="date"
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Monto (EUR)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    value={formData.amount}
                    onChange={e => setFormData({...formData, amount: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Descripcion</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Factura #1024 o Pago Subcontratista"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Proyecto</label>
                  <select
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                    value={formData.project}
                    onChange={e => setFormData({...formData, project: e.target.value})}
                  >
                    {PROJECTS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Categoria</label>
                  <select
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Estado de Pago</label>
                <select
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value})}
                >
                  <option value="pending">Pendiente (No Pagado)</option>
                  <option value="paid">Pagado</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors mt-4 shadow-md"
              >
                {editingTransaction ? 'Actualizar Transaccion' : 'Guardar Transaccion'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Notes Modal */}
      {isNotesModalOpen && selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                  <MessageSquare size={20} /> Notas y Comentarios
                </h3>
                <p className="text-sm text-slate-500 mt-1">{selectedTransaction.description}</p>
              </div>
              <button onClick={() => setIsNotesModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {selectedTransaction.notes && selectedTransaction.notes.length > 0 ? (
                selectedTransaction.notes.map((note, idx) => (
                  <div key={idx} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs font-semibold text-blue-600">{note.user}</span>
                      <span className="text-xs text-slate-400">
                        {new Date(note.timestamp).toLocaleString('es-ES')}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700">{note.text}</p>
                  </div>
                ))
              ) : (
                <p className="text-center text-slate-400 py-8">No hay notas aun.</p>
              )}
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Agregar una nota..."
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddNote()}
                />
                <button
                  onClick={handleAddNote}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Agregar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
