import React, { useState, useEffect } from 'react';
import { Landmark, Save, AlertTriangle, TrendingDown, TrendingUp, CreditCard, Loader2 } from 'lucide-react';
import { useBankAccount } from '../../hooks/useBankAccount';
import { formatCurrency } from '../../utils/formatters';

const BankAccount = ({ user, transactions }) => {
  const { bankAccount, loading, saveBankAccount, calculateRealBalance } = useBankAccount(user);
  const [form, setForm] = useState({
    bankName: '',
    balance: '',
    balanceDate: new Date().toISOString().split('T')[0],
    creditLineLimit: '-40000'
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (bankAccount) {
      setForm({
        bankName: bankAccount.bankName || '',
        balance: String(bankAccount.balance ?? ''),
        balanceDate: bankAccount.balanceDate || new Date().toISOString().split('T')[0],
        creditLineLimit: String(bankAccount.creditLineLimit ?? '-40000')
      });
    }
  }, [bankAccount]);

  const handleSave = async () => {
    setSaving(true);
    const result = await saveBankAccount(form);
    setSaving(false);
    if (result.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const realBalance = calculateRealBalance(transactions || []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <span className="ml-3 text-slate-500">Cargando datos bancarios...</span>
      </div>
    );
  }

  const creditLimit = parseFloat(form.creditLineLimit) || 0;
  const creditUtilizationPct = creditLimit < 0 && realBalance.currentBalance < 0
    ? Math.min((Math.abs(realBalance.currentBalance) / Math.abs(creditLimit)) * 100, 100).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-blue-100 rounded-xl">
          <Landmark className="text-blue-600" size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Cuenta Bancaria</h2>
          <p className="text-sm text-slate-500">Configura el saldo inicial y linea de credito para calcular el flujo de caja real</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Datos de la Cuenta</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Banco</label>
            <input
              type="text"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={form.bankName}
              onChange={(e) => setForm({ ...form, bankName: e.target.value })}
              placeholder="Ej: CaixaBank, Santander..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Fecha del Saldo</label>
            <input
              type="date"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={form.balanceDate}
              onChange={(e) => setForm({ ...form, balanceDate: e.target.value })}
            />
            <p className="text-xs text-slate-400 mt-1">Las transacciones pagadas despues de esta fecha se suman/restan al saldo</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Saldo Bancario (EUR)</label>
            <input
              type="number"
              step="0.01"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={form.balance}
              onChange={(e) => setForm({ ...form, balance: e.target.value })}
              placeholder="Ej: 15000.00"
            />
            <p className="text-xs text-slate-400 mt-1">El saldo real de tu cuenta a la fecha indicada</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Limite Linea de Credito (EUR)</label>
            <input
              type="number"
              step="0.01"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={form.creditLineLimit}
              onChange={(e) => setForm({ ...form, creditLineLimit: e.target.value })}
              placeholder="-40000"
            />
            <p className="text-xs text-slate-400 mt-1">Valor negativo. Ej: -40000 significa que puedes deber hasta 40.000 EUR</p>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {saving ? 'Guardando...' : 'Guardar Configuracion'}
          </button>
          {saved && (
            <span className="text-sm text-emerald-600 font-medium">Guardado correctamente</span>
          )}
        </div>
      </div>

      {/* Real Balance Cards */}
      {bankAccount && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Saldo Inicial</h3>
              <Landmark className="text-blue-500" size={20} />
            </div>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(realBalance.startingBalance)}</p>
            <p className="text-xs text-slate-400 mt-1">Al {bankAccount.balanceDate}</p>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Movimiento Neto</h3>
              {realBalance.netMovement >= 0
                ? <TrendingUp className="text-emerald-500" size={20} />
                : <TrendingDown className="text-rose-500" size={20} />
              }
            </div>
            <p className={`text-2xl font-bold ${realBalance.netMovement >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {realBalance.netMovement >= 0 ? '+' : ''}{formatCurrency(realBalance.netMovement)}
            </p>
            <p className="text-xs text-slate-400 mt-1">{realBalance.transactionsCount} transacciones pagadas</p>
          </div>

          <div className={`bg-white rounded-xl p-5 shadow-sm border ${realBalance.currentBalance < 0 ? 'border-rose-200' : 'border-slate-100'}`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Saldo Actual</h3>
              <Landmark className={realBalance.currentBalance >= 0 ? 'text-emerald-500' : 'text-rose-500'} size={20} />
            </div>
            <p className={`text-2xl font-bold ${realBalance.currentBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {formatCurrency(realBalance.currentBalance)}
            </p>
            <p className="text-xs text-slate-400 mt-1">Saldo proyectado hoy</p>
          </div>

          <div className={`bg-white rounded-xl p-5 shadow-sm border ${parseFloat(creditUtilizationPct) > 80 ? 'border-rose-200' : 'border-slate-100'}`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Credito Disponible</h3>
              <CreditCard className={parseFloat(creditUtilizationPct) > 80 ? 'text-rose-500' : 'text-blue-500'} size={20} />
            </div>
            <p className={`text-2xl font-bold ${parseFloat(creditUtilizationPct) > 80 ? 'text-rose-600' : 'text-blue-600'}`}>
              {formatCurrency(realBalance.availableCredit)}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Limite: {formatCurrency(Math.abs(creditLimit))} | Usado: {creditUtilizationPct}%
            </p>
          </div>
        </div>
      )}

      {/* Credit Line Visualization */}
      {bankAccount && creditLimit < 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Utilizacion de Linea de Credito</h3>

          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-600">Limite: {formatCurrency(Math.abs(creditLimit))}</span>
              <span className={`font-medium ${parseFloat(creditUtilizationPct) > 80 ? 'text-rose-600' : 'text-blue-600'}`}>
                {creditUtilizationPct}% utilizado
              </span>
            </div>
            <div className="w-full h-4 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  parseFloat(creditUtilizationPct) > 80 ? 'bg-rose-500' :
                  parseFloat(creditUtilizationPct) > 50 ? 'bg-amber-500' : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min(parseFloat(creditUtilizationPct), 100)}%` }}
              />
            </div>
          </div>

          {/* Scale markers */}
          <div className="flex justify-between text-xs text-slate-400">
            <span>0 EUR</span>
            <span>{formatCurrency(Math.abs(creditLimit) * 0.5)}</span>
            <span>{formatCurrency(Math.abs(creditLimit))}</span>
          </div>

          {realBalance.currentBalance <= creditLimit && (
            <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2">
              <AlertTriangle className="text-rose-600" size={18} />
              <span className="text-sm text-rose-700 font-medium">
                Has excedido el limite de la linea de credito
              </span>
            </div>
          )}

          {parseFloat(creditUtilizationPct) > 80 && realBalance.currentBalance > creditLimit && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
              <AlertTriangle className="text-amber-600" size={18} />
              <span className="text-sm text-amber-700 font-medium">
                Estas usando mas del 80% de tu linea de credito
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BankAccount;
