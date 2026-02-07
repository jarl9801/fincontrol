import React, { useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Landmark, CreditCard, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { useBankAccount } from '../../hooks/useBankAccount';
import {
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';

const CashFlow = ({ transactions, user }) => {
  const [view, setView] = useState('monthly');
  const { bankAccount, calculateRealBalance } = useBankAccount(user);

  const realBalance = calculateRealBalance(transactions || []);
  const hasBankAccount = !!bankAccount;
  const creditLimit = bankAccount?.creditLineLimit || 0;

  // Group paid transactions by period
  const groupByPeriod = () => {
    const grouped = {};

    transactions
      .filter(t => t.status === 'paid')
      .forEach(t => {
        const date = new Date(t.date);
        let key;

        if (view === 'monthly') {
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        } else {
          const weekNum = Math.ceil(date.getDate() / 7);
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-S${weekNum}`;
        }

        if (!grouped[key]) {
          grouped[key] = { period: key, ingresos: 0, gastos: 0, neto: 0 };
        }

        if (t.type === 'income') {
          grouped[key].ingresos += t.amount;
        } else {
          grouped[key].gastos += t.amount;
        }
      });

    // Calculate net flow and accumulated (starting from bank balance if available)
    let accumulated = hasBankAccount ? bankAccount.balance : 0;

    // Find the period of the balance date to know where to start adding bank balance
    let balancePeriod = null;
    if (hasBankAccount) {
      const balanceDate = new Date(bankAccount.balanceDate);
      if (view === 'monthly') {
        balancePeriod = `${balanceDate.getFullYear()}-${String(balanceDate.getMonth() + 1).padStart(2, '0')}`;
      } else {
        const weekNum = Math.ceil(balanceDate.getDate() / 7);
        balancePeriod = `${balanceDate.getFullYear()}-${String(balanceDate.getMonth() + 1).padStart(2, '0')}-S${weekNum}`;
      }
    }

    const data = Object.values(grouped)
      .sort((a, b) => a.period.localeCompare(b.period))
      .map(item => {
        item.neto = item.ingresos - item.gastos;

        if (hasBankAccount) {
          // Only accumulate from the balance date period onwards with bank balance
          if (balancePeriod && item.period < balancePeriod) {
            // Transactions before balance date: just show flow without bank balance
            item.acumulado = item.neto;
          } else {
            accumulated += item.neto;
            item.acumulado = accumulated;
          }
        } else {
          accumulated += item.neto;
          item.acumulado = accumulated;
        }

        // Format label
        if (view === 'monthly') {
          const [year, month] = item.period.split('-');
          const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
          item.label = `${monthNames[parseInt(month) - 1]} ${year}`;
        } else {
          item.label = item.period.replace(/-/g, ' ');
        }

        // Add credit line reference for chart
        if (creditLimit < 0) {
          item.lineaCredito = creditLimit;
        }

        return item;
      });

    return data;
  };

  const cashFlowData = groupByPeriod();

  // Summary
  const lastPeriod = cashFlowData[cashFlowData.length - 1] || { ingresos: 0, gastos: 0, neto: 0, acumulado: 0 };
  const totalIncome = cashFlowData.reduce((sum, d) => sum + d.ingresos, 0);
  const totalExpenses = cashFlowData.reduce((sum, d) => sum + d.gastos, 0);
  const netCashFlow = totalIncome - totalExpenses;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-xl shadow-lg border border-slate-100">
          <p className="text-sm font-semibold text-slate-700 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
        <div className="flex gap-2">
          <button
            onClick={() => setView('monthly')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              view === 'monthly' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Vista Mensual
          </button>
          <button
            onClick={() => setView('weekly')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              view === 'weekly' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Vista Semanal
          </button>
        </div>
      </div>

      {/* Bank Balance Banner */}
      {hasBankAccount && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Landmark className="text-blue-600" size={20} />
            </div>
            <div>
              <h3 className="font-bold text-blue-800">Flujo de Caja Real - {bankAccount.bankName || 'Cuenta Bancaria'}</h3>
              <p className="text-xs text-blue-600">Basado en saldo bancario del {bankAccount.balanceDate}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white/70 rounded-lg p-3">
              <p className="text-xs text-slate-500 mb-1">Saldo Inicial</p>
              <p className="text-lg font-bold text-blue-600">{formatCurrency(bankAccount.balance)}</p>
            </div>
            <div className="bg-white/70 rounded-lg p-3">
              <p className="text-xs text-slate-500 mb-1">Saldo Actual</p>
              <p className={`text-lg font-bold ${realBalance.currentBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatCurrency(realBalance.currentBalance)}
              </p>
            </div>
            <div className="bg-white/70 rounded-lg p-3">
              <p className="text-xs text-slate-500 mb-1">Linea de Credito</p>
              <p className="text-lg font-bold text-slate-600">{formatCurrency(Math.abs(creditLimit))}</p>
            </div>
            <div className="bg-white/70 rounded-lg p-3">
              <p className="text-xs text-slate-500 mb-1">Disponible Total</p>
              <p className={`text-lg font-bold ${realBalance.availableCredit > 10000 ? 'text-emerald-600' : realBalance.availableCredit > 0 ? 'text-amber-600' : 'text-rose-600'}`}>
                {formatCurrency(realBalance.availableCredit)}
              </p>
            </div>
          </div>
        </div>
      )}

      {!hasBankAccount && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="text-amber-600" size={20} />
          <div>
            <p className="text-sm font-medium text-amber-800">Sin cuenta bancaria configurada</p>
            <p className="text-xs text-amber-600">Ve a Configuracion &gt; Cuenta Bancaria para ingresar tu saldo y linea de credito</p>
          </div>
        </div>
      )}

      {/* Summary metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Total Entradas</h3>
            <TrendingUp className="text-emerald-500" size={20} />
          </div>
          <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalIncome)}</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Total Salidas</h3>
            <TrendingDown className="text-rose-500" size={20} />
          </div>
          <p className="text-2xl font-bold text-rose-600">{formatCurrency(totalExpenses)}</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Flujo Neto</h3>
            <DollarSign className={netCashFlow >= 0 ? 'text-emerald-500' : 'text-rose-500'} size={20} />
          </div>
          <p className={`text-2xl font-bold ${netCashFlow >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {netCashFlow >= 0 ? '+' : ''}{formatCurrency(netCashFlow)}
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
              {hasBankAccount ? 'Saldo Banco' : 'Saldo Acumulado'}
            </h3>
            {hasBankAccount
              ? <Landmark className={realBalance.currentBalance >= 0 ? 'text-blue-500' : 'text-rose-500'} size={20} />
              : <DollarSign className={lastPeriod.acumulado >= 0 ? 'text-blue-500' : 'text-rose-500'} size={20} />
            }
          </div>
          <p className={`text-2xl font-bold ${
            (hasBankAccount ? realBalance.currentBalance : lastPeriod.acumulado) >= 0 ? 'text-blue-600' : 'text-rose-600'
          }`}>
            {formatCurrency(hasBankAccount ? realBalance.currentBalance : Math.abs(lastPeriod.acumulado))}
          </p>
        </div>
      </div>

      {/* Accumulated Cash Flow Chart */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
        <h3 className="text-lg font-bold text-slate-800 mb-4">
          {hasBankAccount ? 'Flujo de Caja Real (desde saldo bancario)' : 'Flujo de Caja Acumulado'}
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={cashFlowData}>
            <defs>
              <linearGradient id="colorAccumulated" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" angle={-45} textAnchor="end" height={80} />
            <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            {creditLimit < 0 && (
              <ReferenceLine
                y={creditLimit}
                stroke="#ef4444"
                strokeDasharray="5 5"
                label={{ value: `Limite Credito: ${formatCurrency(Math.abs(creditLimit))}`, fill: '#ef4444', fontSize: 11 }}
              />
            )}
            <ReferenceLine y={0} stroke="#64748b" strokeWidth={1} />
            <Area
              type="monotone"
              dataKey="acumulado"
              stroke="#3b82f6"
              fillOpacity={1}
              fill="url(#colorAccumulated)"
              name="Saldo Acumulado"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Income vs Expenses Chart */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Ingresos vs Gastos por Periodo</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={cashFlowData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" angle={-45} textAnchor="end" height={80} />
            <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line type="monotone" dataKey="ingresos" stroke="#10b981" strokeWidth={2} name="Ingresos" />
            <Line type="monotone" dataKey="gastos" stroke="#ef4444" strokeWidth={2} name="Gastos" />
            <Line type="monotone" dataKey="neto" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" name="Flujo Neto" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CashFlow;
