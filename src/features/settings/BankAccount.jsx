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
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
        <Loader2 className="w-8 h-8 text-[#0a84ff] animate-spin" />
        <span className="ml-3 text-[#6b7a99]">Preparando datos bancarios...</span>
      </div>
    );
  }

  const creditLimit = parseFloat(form.creditLineLimit) || 0;
  const creditUtilizationPct = creditLimit < 0 && realBalance.currentBalance < 0
    ? Math.min((Math.abs(realBalance.currentBalance) / Math.abs(creditLimit)) * 100, 100).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-[#dbe7ff] bg-[rgba(255,255,255,0.82)] px-6 py-5 shadow-[0_22px_70px_rgba(128,150,196,0.12)] backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(59,130,246,0.12)]">
            <Landmark className="text-[#2563eb]" size={22} />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#5b7bd6]">Tesorería</p>
            <h2 className="text-[24px] font-semibold tracking-[-0.03em] text-[#1f2a44]">Cuenta bancaria</h2>
            <p className="text-sm text-[#6b7a99]">Define el saldo base y el límite operativo para medir la liquidez disponible.</p>
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-[#dce6f8] bg-white/88 p-6 shadow-[0_20px_65px_rgba(134,153,186,0.12)]">
        <h3 className="mb-4 text-base font-semibold tracking-[-0.02em] text-[#1f2a44]">Datos de la cuenta</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-[#6f7f9e]">Nombre del banco</label>
            <input
              type="text"
              className="w-full rounded-2xl border border-[#d8e3f7] bg-[rgba(247,250,255,0.95)] px-4 py-2.5 text-sm text-[#22304f] outline-none transition focus:border-[#7aa2ff] focus:ring-2 focus:ring-[rgba(59,130,246,0.12)]"
              value={form.bankName}
              onChange={(e) => setForm({ ...form, bankName: e.target.value })}
              placeholder="Ej: CaixaBank, Santander..."
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-[#6f7f9e]">Fecha del saldo</label>
            <input
              type="date"
              className="w-full rounded-2xl border border-[#d8e3f7] bg-[rgba(247,250,255,0.95)] px-4 py-2.5 text-sm text-[#22304f] outline-none transition focus:border-[#7aa2ff] focus:ring-2 focus:ring-[rgba(59,130,246,0.12)]"
              value={form.balanceDate}
              onChange={(e) => setForm({ ...form, balanceDate: e.target.value })}
            />
            <p className="mt-1 text-xs text-[#70819f]">Los movimientos posteriores a esta fecha ajustan el saldo base.</p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-[#6f7f9e]">Saldo bancario (EUR)</label>
            <input
              type="number"
              step="0.01"
              className="w-full rounded-2xl border border-[#d8e3f7] bg-[rgba(247,250,255,0.95)] px-4 py-2.5 text-sm text-[#22304f] outline-none transition focus:border-[#7aa2ff] focus:ring-2 focus:ring-[rgba(59,130,246,0.12)]"
              value={form.balance}
              onChange={(e) => setForm({ ...form, balance: e.target.value })}
              placeholder="Ej: 15000.00"
            />
            <p className="mt-1 text-xs text-[#70819f]">Saldo confirmado por el banco en la fecha seleccionada.</p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-[#6f7f9e]">Límite de línea de crédito (EUR)</label>
            <input
              type="number"
              step="0.01"
              className="w-full rounded-2xl border border-[#d8e3f7] bg-[rgba(247,250,255,0.95)] px-4 py-2.5 text-sm text-[#22304f] outline-none transition focus:border-[#7aa2ff] focus:ring-2 focus:ring-[rgba(59,130,246,0.12)]"
              value={form.creditLineLimit}
              onChange={(e) => setForm({ ...form, creditLineLimit: e.target.value })}
              placeholder="-40000"
            />
            <p className="mt-1 text-xs text-[#70819f]">Usa un valor negativo. Ejemplo: `-40000` equivale a 40.000 EUR disponibles.</p>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#2563eb] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1f56cf] disabled:opacity-50"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {saving ? 'Guardando...' : 'Guardar configuración'}
          </button>
          {saved && (
            <span className="text-sm font-medium text-[#0f9f6e]">Configuración guardada</span>
          )}
        </div>
      </div>

      {bankAccount && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-[24px] border border-[#dce6f8] bg-white/86 p-5 shadow-[0_18px_55px_rgba(134,153,186,0.12)]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#70819f]">Saldo inicial</h3>
              <Landmark className="text-[#2563eb]" size={18} />
            </div>
            <p className="text-[28px] font-semibold tracking-[-0.03em] text-[#1f5fbf]">{formatCurrency(realBalance.startingBalance)}</p>
            <p className="mt-1 text-xs text-[#70819f]">Al {bankAccount.balanceDate}</p>
          </div>

          <div className="rounded-[24px] border border-[#dce6f8] bg-white/86 p-5 shadow-[0_18px_55px_rgba(134,153,186,0.12)]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#70819f]">Movimiento neto</h3>
              {realBalance.netMovement >= 0
                ? <TrendingUp className="text-[#0f9f6e]" size={18} />
                : <TrendingDown className="text-[#d04c36]" size={18} />
              }
            </div>
            <p className={`text-[28px] font-semibold tracking-[-0.03em] ${realBalance.netMovement >= 0 ? 'text-[#0f9f6e]' : 'text-[#d04c36]'}`}>
              {realBalance.netMovement >= 0 ? '+' : ''}{formatCurrency(realBalance.netMovement)}
            </p>
            <p className="mt-1 text-xs text-[#70819f]">{realBalance.transactionsCount} movimientos contabilizados</p>
          </div>

          <div className={`rounded-[24px] bg-white/86 p-5 shadow-[0_18px_55px_rgba(134,153,186,0.12)] ${realBalance.currentBalance < 0 ? 'border border-[rgba(208,76,54,0.24)]' : 'border border-[#dce6f8]'}`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#70819f]">Saldo actual</h3>
              <Landmark className={realBalance.currentBalance >= 0 ? 'text-[#0f9f6e]' : 'text-[#d04c36]'} size={18} />
            </div>
            <p className={`text-[28px] font-semibold tracking-[-0.03em] ${realBalance.currentBalance >= 0 ? 'text-[#0f9f6e]' : 'text-[#d04c36]'}`}>
              {formatCurrency(realBalance.currentBalance)}
            </p>
            <p className="mt-1 text-xs text-[#70819f]">Saldo operativo proyectado al día de hoy</p>
          </div>

          <div className={`rounded-[24px] bg-white/86 p-5 shadow-[0_18px_55px_rgba(134,153,186,0.12)] ${parseFloat(creditUtilizationPct) > 80 ? 'border border-[rgba(208,76,54,0.24)]' : 'border border-[#dce6f8]'}`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#70819f]">Crédito disponible</h3>
              <CreditCard className={parseFloat(creditUtilizationPct) > 80 ? 'text-[#d04c36]' : 'text-[#2563eb]'} size={18} />
            </div>
            <p className={`text-[28px] font-semibold tracking-[-0.03em] ${parseFloat(creditUtilizationPct) > 80 ? 'text-[#d04c36]' : 'text-[#1f5fbf]'}`}>
              {formatCurrency(realBalance.availableCredit)}
            </p>
            <p className="mt-1 text-xs text-[#70819f]">
              Límite: {formatCurrency(Math.abs(creditLimit))} | Uso: {creditUtilizationPct}%
            </p>
          </div>
        </div>
      )}

      {bankAccount && creditLimit < 0 && (
        <div className="rounded-[28px] border border-[#dce6f8] bg-white/88 p-6 shadow-[0_20px_65px_rgba(134,153,186,0.12)]">
          <h3 className="mb-4 text-base font-semibold tracking-[-0.02em] text-[#1f2a44]">Utilización de línea de crédito</h3>

          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-[#6f7f9e]">Límite: {formatCurrency(Math.abs(creditLimit))}</span>
              <span className={`font-medium ${parseFloat(creditUtilizationPct) > 80 ? 'text-[#d04c36]' : 'text-[#1f5fbf]'}`}>
                {creditUtilizationPct}% utilizado
              </span>
            </div>
            <div className="h-4 w-full overflow-hidden rounded-full bg-[#edf3ff]">
              <div
                className={`h-full rounded-full transition-all ${
                  parseFloat(creditUtilizationPct) > 80 ? 'bg-[#f4a69b]' :
                  parseFloat(creditUtilizationPct) > 50 ? 'bg-[#f3cf8c]' : 'bg-[#8db6ff]'
                }`}
                style={{ width: `${Math.min(parseFloat(creditUtilizationPct), 100)}%` }}
              />
            </div>
          </div>

          <div className="flex justify-between text-xs text-[#70819f]">
            <span>0 EUR</span>
            <span>{formatCurrency(Math.abs(creditLimit) * 0.5)}</span>
            <span>{formatCurrency(Math.abs(creditLimit))}</span>
          </div>

          {realBalance.currentBalance <= creditLimit && (
            <div className="mt-4 flex items-center gap-2 rounded-2xl border border-[rgba(208,76,54,0.24)] bg-[rgba(255,244,241,0.92)] p-3">
              <AlertTriangle className="text-[#d04c36]" size={18} />
              <span className="text-sm font-medium text-[#d04c36]">
                Has superado el límite de la línea de crédito
              </span>
            </div>
          )}

          {parseFloat(creditUtilizationPct) > 80 && realBalance.currentBalance > creditLimit && (
            <div className="mt-4 flex items-center gap-2 rounded-2xl border border-[rgba(214,149,44,0.24)] bg-[rgba(255,248,234,0.94)] p-3">
              <AlertTriangle className="text-[#c98717]" size={18} />
              <span className="text-sm font-medium text-[#c98717]">
                Estás usando más del 80% de la línea de crédito
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BankAccount;
