import React, { useState } from 'react';
import { Search, Filter, Download, Plus, FileText, X, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import TransactionRow from '../../components/ui/TransactionRow';
import FilterPanel from '../../components/ui/FilterPanel';
import TransactionFormModal from '../../components/ui/TransactionFormModal';
import NotesModal from '../../components/ui/NotesModal';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { useTransactionActions } from '../../hooks/useTransactionActions';
import { useCategories } from '../../hooks/useCategories';
import { useCostCenters } from '../../hooks/useCostCenters';
import { exportTransactionsToPDF } from '../../utils/pdfExport';

const TransactionList = ({
  transactions,
  userRole,
  searchTerm,
  setSearchTerm,
  filters,
  setFilters,
  applyFilters,
  user
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [transactionToDelete, setTransactionToDelete] = useState(null);
  const [sortConfig, setSortConfig] = useState({ field: 'date', direction: 'desc' });

  const {
    createTransaction,
    updateTransaction,
    deleteTransaction,
    toggleStatus,
    addNote,
    markAsRead
  } = useTransactionActions(user);

  const { expenseCategories, incomeCategories } = useCategories(user);
  const { costCenters } = useCostCenters(user);

  // Sorting logic
  const handleSort = (field) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const sortedTransactions = [...transactions].sort((a, b) => {
    if (sortConfig.field === 'date') {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return sortConfig.direction === 'desc' ? dateB - dateA : dateA - dateB;
    }
    if (sortConfig.field === 'amount') {
      return sortConfig.direction === 'desc' ? b.amount - a.amount : a.amount - b.amount;
    }
    return 0;
  });

  // Sortable header component
  const SortableHeader = ({ field, label, align = 'left' }) => {
    const isActive = sortConfig.field === field;
    return (
      <th
        className={`px-4 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 transition-colors select-none ${align === 'right' ? 'text-right' : ''}`}
        onClick={() => handleSort(field)}
      >
        <span className={`inline-flex items-center gap-1 ${align === 'right' ? 'justify-end' : ''}`}>
          {label}
          {isActive ? (
            sortConfig.direction === 'desc' ? <ArrowDown size={14} /> : <ArrowUp size={14} />
          ) : (
            <ArrowUpDown size={14} className="opacity-40" />
          )}
        </span>
      </th>
    );
  };

  const handleToggleStatus = async (transaction) => {
    if (userRole !== 'admin') return;
    await toggleStatus(transaction);
  };

  const handleDelete = (transaction) => {
    setTransactionToDelete(transaction);
    setIsConfirmModalOpen(true);
  };

  const confirmDelete = async () => {
    if (transactionToDelete) {
      await deleteTransaction(transactionToDelete.id);
      setTransactionToDelete(null);
    }
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setIsFormModalOpen(true);
    if (transaction.hasUnreadUpdates) {
      markAsRead(transaction.id);
    }
  };

  const handleViewNotes = (transaction) => {
    setSelectedTransaction(transaction);
    setIsNotesModalOpen(true);
    if (transaction.hasUnreadUpdates) {
      markAsRead(transaction.id);
    }
  };

  const handleFormSubmit = async (formData) => {
    if (editingTransaction) {
      await updateTransaction(editingTransaction.id, formData, editingTransaction.notes);
    } else {
      // Create new transaction
      await createTransaction(formData);
    }
    setIsFormModalOpen(false);
    setEditingTransaction(null);
  };

  const handleAddNote = async (transaction, noteText) => {
    await addNote(transaction, noteText);
    const updatedTransaction = {
      ...transaction,
      notes: [
        ...transaction.notes,
        {
          text: noteText,
          timestamp: new Date().toISOString(),
          user: user.email
        }
      ]
    };
    setSelectedTransaction(updatedTransaction);
  };

  const exportToPDF = () => {
    exportTransactionsToPDF(transactions, 'Todas las Transacciones');
  };

  // Contar filtros activos
  const activeFiltersCount = Object.values(filters).filter(v => v && v !== 'all').length;

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header con búsqueda y acciones */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 w-full md:w-auto">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar transacciones..."
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 w-full md:w-auto">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`
                flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all
                ${showFilters || activeFiltersCount > 0
                  ? 'bg-blue-100 text-blue-700 border-2 border-blue-200'
                  : 'bg-slate-100 text-slate-700 border-2 border-transparent hover:bg-slate-200'}
              `}
            >
              <Filter size={18} />
              Filtros
              {activeFiltersCount > 0 && (
                <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {activeFiltersCount}
                </span>
              )}
            </button>
            {userRole === 'admin' && (
              <button
                onClick={exportToPDF}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-medium transition-all shadow-sm hover:shadow-md"
              >
                <Download size={18} /> Exportar
              </button>
            )}
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-slate-100 animate-fadeIn">
            <FilterPanel
              filters={filters}
              setFilters={setFilters}
              onApply={() => {
                applyFilters();
                setShowFilters(false);
              }}
            />
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between px-2">
        <p className="text-sm text-slate-500">
          Mostrando <span className="font-semibold text-slate-700">{transactions.length}</span> transacciones
        </p>
        {activeFiltersCount > 0 && (
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
              applyFilters();
            }}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/80 border-b border-slate-200">
              <tr>
                <SortableHeader field="date" label="Fecha" />
                <th className="px-4 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Descripción</th>
                <th className="px-4 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Categoría</th>
                <SortableHeader field="amount" label="Monto" align="right" />
                <th className="px-4 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Estado</th>
                <th className="px-4 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedTransactions.map((t, idx) => (
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
              {transactions.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                        <FileText className="w-8 h-8 text-slate-300" />
                      </div>
                      <p className="text-sm">No se encontraron transacciones</p>
                      {(searchTerm || activeFiltersCount > 0) && (
                        <button
                          onClick={() => {
                            setSearchTerm('');
                            setFilters({
                              dateFrom: '',
                              dateTo: '',
                              project: '',
                              category: '',
                              type: '',
                              status: '',
                              quickFilter: 'all'
                            });
                            applyFilters();
                          }}
                          className="text-sm text-blue-500 hover:text-blue-600 font-medium"
                        >
                          Limpiar búsqueda y filtros
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <TransactionFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingTransaction(null);
        }}
        onSubmit={handleFormSubmit}
        editingTransaction={editingTransaction}
        user={user}
        expenseCategories={expenseCategories}
        incomeCategories={incomeCategories}
        costCenters={costCenters}
      />

      <NotesModal
        isOpen={isNotesModalOpen}
        onClose={() => {
          setIsNotesModalOpen(false);
          setSelectedTransaction(null);
        }}
        transaction={selectedTransaction}
        onAddNote={handleAddNote}
      />

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => {
          setIsConfirmModalOpen(false);
          setTransactionToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Eliminar Transacción"
        message={`¿Estás seguro de eliminar la transacción "${transactionToDelete?.description}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
};

export default TransactionList;
