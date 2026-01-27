import React, { useState } from 'react';
import { Search, Filter, Download } from 'lucide-react';
import TransactionRow from '../../components/ui/TransactionRow';
import FilterPanel from '../../components/ui/FilterPanel';
import TransactionFormModal from '../../components/ui/TransactionFormModal';
import NotesModal from '../../components/ui/NotesModal';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { useTransactionActions } from '../../hooks/useTransactionActions';
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

  const {
    updateTransaction,
    deleteTransaction,
    toggleStatus,
    addNote,
    markAsRead
  } = useTransactionActions(user);

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
    // Marcar como leída al editar
    if (transaction.hasUnreadUpdates) {
      markAsRead(transaction.id);
    }
  };

  const handleViewNotes = (transaction) => {
    setSelectedTransaction(transaction);
    setIsNotesModalOpen(true);
    // Marcar como leída al ver notas
    if (transaction.hasUnreadUpdates) {
      markAsRead(transaction.id);
    }
  };

  const handleFormSubmit = async (formData) => {
    if (editingTransaction) {
      await updateTransaction(editingTransaction.id, formData, editingTransaction.notes);
    }
    setIsFormModalOpen(false);
    setEditingTransaction(null);
  };

  const handleAddNote = async (transaction, noteText) => {
    await addNote(transaction, noteText);
    // Update selected transaction to show new note
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

  return (
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
            applyFilters();
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
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Descripción</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Categoría</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Monto</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Estado</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.map(t => (
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
                  <td colSpan="6" className="px-4 py-8 text-center text-slate-400">
                    No se encontraron registros que coincidan con los filtros.
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
      />

      <NotesModal
        isOpen={isNotesModalOpen}
        onClose={() => {
          setIsNotesModalOpen(false);
          setSelectedTransaction(null);
        }}
        transaction={selectedTransaction}
        onAddNote={handleAddNote}
        user={user}
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
