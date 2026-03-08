import React, { useState, useMemo } from 'react';
import {
  Scale, CheckCircle2, AlertTriangle, Plus, ArrowRight, X
} from 'lucide-react';
import { useReconciliation } from '../../hooks/useReconciliation';
import { useAllTransactions } from '../../hooks/useAllTransactions';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useToast } from '../../contexts/ToastContext';

const CreateReconciliationModal = ({ isOpen, onClose, onSubmit, systemBalance }) => {
  const now = new Date();
  const [form, setForm] = useState({
    month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
    bankBalance: '',
    notes: '',
  });

  if (!isOpen) return null;

  const disc = form.bankBalance ? (parseFloat(form.bankBalance) - systemBalance) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#1c1c1e] rounded-2xl border border-[rgba(255,255,255,0.1)] p-6 w-full max-w-md" style={{ boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
        <h3 className="text-lg font-bold text-white mb-5">Nueva Conciliación</h3>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit({ ...form, systemBalance }); onClose(); }} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-[#8e8e93] uppercase mb-1.5">Mes *</label>
            <input type="month" value={form.month} onChange={e => setForm(p => ({ ...p, month: e.target.value }))} required
              className="w-full bg-[#2c2c2e] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#0a84ff] focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-[#8e8e93] uppercase mb-1.5">Saldo Banco Real *</label>
              <input type="number" step="0.01" value={form.bankBalance} onChange={e => setForm(p => ({ ...p, bankBalance: e.target.value }))} required
                className="w-full bg-[#2c2c2e] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#0a84ff] focus:outline-none" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#8e8e93] uppercase mb-1.5">Saldo Sistema</label>
              <div className="px-3 py-2.5 bg-[#2c2c2e] border border-[rgba(255,255,255,0.08)] rounded-lg text-sm text-[#8e8e93]">
                {formatCurrency(systemBalance)}
              </div>
            </div>
          </div>
          {form.bankBalance && (
            <div className={`p-3 rounded-lg border ${Math.abs(disc) < 1 ? 'bg-[rgba(48,209,88,0.08)] border-[rgba(48,209,88,0.2)]' : 'bg-[rgba(255,69,58,0.08)] border-[rgba(255,69,58,0.2)]'}`}>
              <p className="text-[12px] font-medium text-[#c7c7cc]">
                Discrepancia: <span className={Math.abs(disc) < 1 ? 'text-[#30d158]' : 'text-[#ff453a]'}>{disc >= 0 ? '+' : ''}{formatCurrency(disc)}</span>
              </p>
            </div>
          )}
          <div>
            <label className="block text-[11px] font-semibold text-[#8e8e93] uppercase mb-1.5">Notas</label>
            <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2}
              className="w-full bg-[#2c2c2e] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none resize-none" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-medium text-[#8e8e93] hover:bg-[rgba(255,255,255,0.05)] transition-colors">Cancelar</button>
            <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#0a84ff] hover:bg-[#0070d8] transition-colors shadow-sm">Crear</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Conciliacion = ({ user, userRole }) => {
  const { reconciliations, loading, createReconciliation, markReconciled } = useReconciliation(user);
  const { allTransactions } = useAllTransactions(user);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  let toastCtx;
  try { toastCtx = useToast(); } catch { toastCtx = null; }
  const showToast = toastCtx?.showToast;

  const canAct = userRole === 'admin';

  // Calculate system balance from transactions
  const systemBalance = useMemo(() => {
    return allTransactions.reduce((sum, t) => {
      if (t.status === 'pending') return sum;
      return sum + (t.type === 'income' ? t.amount : -t.amount);
    }, 28450); // Starting bank balance
  }, [allTransactions]);

  const reconciledCount = reconciliations.filter(r => r.status === 'reconciled').length;
  const pendingCount = reconciliations.filter(r => r.status === 'pending').length;
  const totalDiscrepancy = reconciliations.filter(r => r.status === 'pending').reduce((s, r) => s + Math.abs(r.discrepancy || 0), 0);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-[#0a84ff] border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Conciliación Bancaria</h2>
          <p className="text-[13px] text-[#636366] mt-0.5">Comparar saldo del banco con saldo en FinControl</p>
        </div>
        {canAct && (
          <button onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#0a84ff] hover:bg-[#0070d8] text-white rounded-xl text-[13px] font-semibold transition-all shadow-sm">
            <Plus size={16} /> Nueva Conciliación
          </button>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#1c1c1e] rounded-xl p-5 border border-[rgba(10,132,255,0.15)]" style={{ background: 'linear-gradient(135deg, rgba(10,132,255,0.08) 0%, #1c1c1e 55%)' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-semibold text-[#8e8e93] uppercase tracking-wider">Saldo Sistema</p>
            <Scale size={18} className="text-[#0a84ff]" />
          </div>
          <p className="text-[28px] font-bold text-[#0a84ff]">{formatCurrency(systemBalance)}</p>
          <p className="text-[11px] text-[#636366] mt-1">Calculado desde transacciones</p>
        </div>
        <div className="bg-[#1c1c1e] rounded-xl p-5 border border-[rgba(48,209,88,0.15)]" style={{ background: 'linear-gradient(135deg, rgba(48,209,88,0.08) 0%, #1c1c1e 55%)' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-semibold text-[#8e8e93] uppercase tracking-wider">Conciliados</p>
            <CheckCircle2 size={18} className="text-[#30d158]" />
          </div>
          <p className="text-[28px] font-bold text-[#30d158]">{reconciledCount}</p>
          <p className="text-[11px] text-[#636366] mt-1">Meses conciliados</p>
        </div>
        <div className="bg-[#1c1c1e] rounded-xl p-5 border border-[rgba(255,159,10,0.15)]" style={{ background: 'linear-gradient(135deg, rgba(255,159,10,0.08) 0%, #1c1c1e 55%)' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-semibold text-[#8e8e93] uppercase tracking-wider">Pendientes</p>
            <AlertTriangle size={18} className="text-[#ff9f0a]" />
          </div>
          <p className="text-[28px] font-bold text-[#ff9f0a]">{pendingCount}</p>
          <p className="text-[11px] text-[#636366] mt-1">Por conciliar</p>
        </div>
        <div className="bg-[#1c1c1e] rounded-xl p-5 border border-[rgba(255,69,58,0.15)]" style={{ background: 'linear-gradient(135deg, rgba(255,69,58,0.08) 0%, #1c1c1e 55%)' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-semibold text-[#8e8e93] uppercase tracking-wider">Discrepancia Total</p>
            <AlertTriangle size={18} className="text-[#ff453a]" />
          </div>
          <p className="text-[28px] font-bold text-[#ff453a]">{formatCurrency(totalDiscrepancy)}</p>
          <p className="text-[11px] text-[#636366] mt-1">En meses pendientes</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#1c1c1e] rounded-2xl border border-[rgba(255,255,255,0.06)] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[rgba(255,255,255,0.06)]">
          <h4 className="text-[13px] font-semibold text-[#c7c7cc]">Historial de Conciliaciones</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[rgba(255,255,255,0.02)] border-b border-[rgba(255,255,255,0.06)]">
              <tr>
                <th className="px-4 py-3 text-[11px] font-semibold text-[#636366] uppercase tracking-wider">Mes</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-[#636366] uppercase tracking-wider text-right">Saldo Banco</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-[#636366] uppercase tracking-wider text-right">Saldo Sistema</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-[#636366] uppercase tracking-wider text-right">Discrepancia</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-[#636366] uppercase tracking-wider text-center">Estado</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-[#636366] uppercase tracking-wider hidden md:table-cell">Notas</th>
                {canAct && <th className="px-4 py-3 text-[11px] font-semibold text-[#636366] uppercase tracking-wider text-center">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(255,255,255,0.04)]">
              {reconciliations.map((r) => {
                const absDisc = Math.abs(r.discrepancy || 0);
                const isSmall = absDisc < 100;
                return (
                  <tr key={r.id} className="hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                    <td className="px-4 py-3.5 text-[13px] font-semibold text-white">{r.month}</td>
                    <td className="px-4 py-3.5 text-right text-[13px] text-[#c7c7cc]">{formatCurrency(r.bankBalance)}</td>
                    <td className="px-4 py-3.5 text-right text-[13px] text-[#c7c7cc]">{formatCurrency(r.systemBalance)}</td>
                    <td className="px-4 py-3.5 text-right">
                      <span className={`text-[13px] font-bold ${isSmall ? 'text-[#30d158]' : 'text-[#ff453a]'}`}>
                        {r.discrepancy >= 0 ? '+' : ''}{formatCurrency(r.discrepancy || 0)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {r.status === 'reconciled' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-[rgba(48,209,88,0.12)] text-[#30d158] border border-[rgba(48,209,88,0.25)]">
                          <CheckCircle2 size={12} /> Conciliado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-[rgba(255,159,10,0.12)] text-[#ff9f0a] border border-[rgba(255,159,10,0.25)]">
                          Pendiente
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell text-[12px] text-[#8e8e93] max-w-[200px] truncate">{r.notes || '-'}</td>
                    {canAct && (
                      <td className="px-4 py-3.5 text-center">
                        {r.status !== 'reconciled' && (
                          <button
                            onClick={async () => {
                              const result = await markReconciled(r.id);
                              if (result?.success) showToast?.('Mes conciliado');
                              else showToast?.('Error al conciliar', 'error');
                            }}
                            className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-white bg-[#30d158] hover:bg-[#28c74e] transition-all">
                            Conciliar
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
              {reconciliations.length === 0 && (
                <tr>
                  <td colSpan={canAct ? 7 : 6} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-[#636366]">
                      <Scale className="w-8 h-8" />
                      <p className="text-sm">No hay conciliaciones registradas</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CreateReconciliationModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        systemBalance={systemBalance}
        onSubmit={async (data) => {
          const result = await createReconciliation(data);
          if (result?.success) showToast?.('Conciliación creada');
          else showToast?.('Error al crear', 'error');
        }}
      />
    </div>
  );
};

export default Conciliacion;
