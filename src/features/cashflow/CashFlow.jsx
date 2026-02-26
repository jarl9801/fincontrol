import React, { useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Landmark, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { useBankAccount } from '../../hooks/useBankAccount';
import {
  ComposedChart, Bar, Line,
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
          if (balancePeriod && item.period < balancePeriod) {
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

  const formatAxis = (value) => {
    if (Math.abs(value) >= 1000) return `€${(value / 1000).toFixed(0)}k`;
    return `€${value}`;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1c1c1e] p-3 rounded-xl shadow-lg border border-[rgba(255,255,255,0.08)]">
          <p className="text-sm font-semibold text-[#c7c7cc] mb-2">{label}</p>
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

  // Running accumulated for table
  let tableAccumulated = 0;
  const tableData = cashFlowData.map(row => {
    tableAccumulated += row.neto;
    return { ...row, tableAccumulado: row.acumulado };
  });

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-[#1c1c1e] rounded-xl p-4 border border-[rgba(255,255,255,0.08)]">
        <div className="flex gap-2">
          <button
            onClick={() => setView('monthly')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              view === 'monthly' ? 'bg-[rgba(255,255,255,0.14)] text-white' : 'bg-[#2c2c2e] text-[#98989d] hover:bg-[#2c2c2e]'
            }`}
          >
            Vista Mensual
          </button>
          <button
            onClick={() => setView('weekly')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              view === 'weekly' ? 'bg-[rgba(255,255,255,0.14)] text-white' : 'bg-[#2c2c2e] text-[#98989d] hover:bg-[#2c2c2e]'
            }`}
          >
            Vista Semanal
          </button>
        </div>
      </div>

      {/* Bank Balance Banner */}
      {hasBankAccount && (
        <div className="bg-[#111111] border border-[rgba(255,255,255,0.08)] rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-[#2c2c2e] rounded-lg">
              <Landmark className="text-[#98989d]" size={20} />
            </div>
            <div>
              <h3 className="font-bold text-[#e5e5ea]">Flujo de Caja Real — {bankAccount.bankName || 'Cuenta Bancaria'}</h3>
              <p className="text-xs text-[#8e8e93]">Basado en saldo bancario del {bankAccount.balanceDate}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-[#1c1c1e] rounded-lg p-3 border border-[rgba(255,255,255,0.08)]">
              <p className="text-xs text-[#8e8e93] mb-1">Saldo Inicial</p>
              <p className="text-lg font-bold text-[#c7c7cc]">{formatCurrency(bankAccount.balance)}</p>
            </div>
            <div className="bg-[#1c1c1e] rounded-lg p-3 border border-[rgba(255,255,255,0.08)]">
              <p className="text-xs text-[#8e8e93] mb-1">Saldo Actual</p>
              <p className={`text-lg font-bold ${realBalance.currentBalance >= 0 ? 'text-[#30d158]' : 'text-[#ff453a]'}`}>
                {formatCurrency(realBalance.currentBalance)}
              </p>
            </div>
            <div className="bg-[#1c1c1e] rounded-lg p-3 border border-[rgba(255,255,255,0.08)]">
              <p className="text-xs text-[#8e8e93] mb-1">Línea de Crédito</p>
              <p className="text-lg font-bold text-[#98989d]">{formatCurrency(Math.abs(creditLimit))}</p>
            </div>
            <div className="bg-[#1c1c1e] rounded-lg p-3 border border-[rgba(255,255,255,0.08)]">
              <p className="text-xs text-[#8e8e93] mb-1">Disponible Total</p>
              <p className={`text-lg font-bold ${realBalance.availableCredit > 10000 ? 'text-[#30d158]' : realBalance.availableCredit > 0 ? 'text-[#ff9f0a]' : 'text-[#ff453a]'}`}>
                {formatCurrency(realBalance.availableCredit)}
              </p>
            </div>
          </div>
        </div>
      )}

      {!hasBankAccount && (
        <div className="bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.25)] rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="text-[#ff9f0a]" size={20} />
          <div>
            <p className="text-sm font-medium text-[#ff9f0a]">Sin cuenta bancaria configurada</p>
            <p className="text-xs text-[#ff9f0a]">Ve a Configuración &gt; Cuenta Bancaria para ingresar tu saldo y línea de crédito</p>
          </div>
        </div>
      )}

      {/* Summary metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#1c1c1e] rounded-xl p-5 border border-[rgba(255,255,255,0.08)]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-[#c7c7cc]">Total Entradas</h3>
            <TrendingUp className="text-[#30d158]" size={18} />
          </div>
          <p className="text-2xl font-bold text-[#30d158]">{formatCurrency(totalIncome)}</p>
        </div>

        <div className="bg-[#1c1c1e] rounded-xl p-5 border border-[rgba(255,255,255,0.08)]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-[#c7c7cc]">Total Salidas</h3>
            <TrendingDown className="text-[#ff453a]" size={18} />
          </div>
          <p className="text-2xl font-bold text-[#ff453a]">{formatCurrency(totalExpenses)}</p>
        </div>

        <div className="bg-[#1c1c1e] rounded-xl p-5 border border-[rgba(255,255,255,0.08)]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-[#c7c7cc]">Flujo Neto</h3>
            <DollarSign className={netCashFlow >= 0 ? 'text-[#30d158]' : 'text-[#ff453a]'} size={18} />
          </div>
          <p className={`text-2xl font-bold ${netCashFlow >= 0 ? 'text-[#30d158]' : 'text-[#ff453a]'}`}>
            {netCashFlow >= 0 ? '+' : ''}{formatCurrency(netCashFlow)}
          </p>
        </div>

        <div className="bg-[#1c1c1e] rounded-xl p-5 border border-[rgba(255,255,255,0.08)]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-[#c7c7cc]">
              {hasBankAccount ? 'Saldo Banco' : 'Saldo Acumulado'}
            </h3>
            {hasBankAccount
              ? <Landmark className={realBalance.currentBalance >= 0 ? 'text-[#8e8e93]' : 'text-[#ff453a]'} size={18} />
              : <DollarSign className={lastPeriod.acumulado >= 0 ? 'text-[#8e8e93]' : 'text-[#ff453a]'} size={18} />
            }
          </div>
          <p className={`text-2xl font-bold ${
            (hasBankAccount ? realBalance.currentBalance : lastPeriod.acumulado) >= 0 ? 'text-[#c7c7cc]' : 'text-[#ff453a]'
          }`}>
            {formatCurrency(hasBankAccount ? realBalance.currentBalance : Math.abs(lastPeriod.acumulado))}
          </p>
        </div>
      </div>

      {/* Monthly Table */}
      {cashFlowData.length > 0 && (
        <div className="bg-[#1c1c1e] rounded-xl border border-[rgba(255,255,255,0.08)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.08)]">
            <h3 className="text-sm font-semibold text-[#c7c7cc]">
              Detalle por {view === 'monthly' ? 'Mes' : 'Semana'}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#111111] text-[#8e8e93] text-xs uppercase tracking-wider">
                  <th className="text-left px-6 py-3 font-semibold">{view === 'monthly' ? 'Mes' : 'Semana'}</th>
                  <th className="text-right px-6 py-3 font-semibold">Ingresos</th>
                  <th className="text-right px-6 py-3 font-semibold">Egresos</th>
                  <th className="text-right px-6 py-3 font-semibold">Flujo Neto</th>
                  <th className="text-right px-6 py-3 font-semibold">Acumulado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(255,255,255,0.08)]">
                {cashFlowData.map((row, i) => (
                  <tr key={i} className="hover:bg-[#111111] transition-colors">
                    <td className="px-6 py-3 font-medium text-[#c7c7cc]">{row.label}</td>
                    <td className="px-6 py-3 text-right text-[#30d158]">{formatCurrency(row.ingresos)}</td>
                    <td className="px-6 py-3 text-right text-[#ff453a]">{formatCurrency(row.gastos)}</td>
                    <td className={`px-6 py-3 text-right font-medium ${row.neto >= 0 ? 'text-[#30d158]' : 'text-[#ff453a]'}`}>
                      {row.neto >= 0 ? '+' : ''}{formatCurrency(row.neto)}
                    </td>
                    <td className={`px-6 py-3 text-right font-bold ${row.acumulado < 0 ? 'text-[#ff453a]' : 'text-[#c7c7cc]'}`}>
                      {formatCurrency(row.acumulado)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-[rgba(255,255,255,0.14)] bg-[#111111]">
                  <td className="px-6 py-3 font-bold text-[#c7c7cc]">Total</td>
                  <td className="px-6 py-3 text-right font-bold text-[#30d158]">{formatCurrency(totalIncome)}</td>
                  <td className="px-6 py-3 text-right font-bold text-[#ff453a]">{formatCurrency(totalExpenses)}</td>
                  <td className={`px-6 py-3 text-right font-bold ${netCashFlow >= 0 ? 'text-[#30d158]' : 'text-[#ff453a]'}`}>
                    {netCashFlow >= 0 ? '+' : ''}{formatCurrency(netCashFlow)}
                  </td>
                  <td className="px-6 py-3 text-right font-bold text-[#c7c7cc]">—</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Combined Chart */}
      <div className="bg-[#1c1c1e] rounded-xl p-6 border border-[rgba(255,255,255,0.08)]">
        <h3 className="text-sm font-semibold text-[#c7c7cc] mb-4">
          {hasBankAccount ? 'Ingresos, Gastos y Saldo Real' : 'Ingresos, Gastos y Acumulado'}
        </h3>
        <ResponsiveContainer width="100%" height={360}>
          <ComposedChart data={cashFlowData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradIngresos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#30d158" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#30d158" stopOpacity={0.7} />
              </linearGradient>
              <linearGradient id="gradGastos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ff453a" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#ff453a" stopOpacity={0.7} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12, fill: '#636366' }}
              axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
              tickLine={false}
            />
            <YAxis
              yAxisId="left"
              tickFormatter={formatAxis}
              tick={{ fontSize: 12, fill: '#636366' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tickFormatter={formatAxis}
              tick={{ fontSize: 12, fill: '#636366' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ paddingTop: 16, fontSize: 12 }}
            />
            <ReferenceLine yAxisId="left" y={0} stroke="rgba(255,255,255,0.14)" strokeWidth={1} />
            {creditLimit < 0 && (
              <ReferenceLine
                yAxisId="right"
                y={creditLimit}
                stroke="#ff453a"
                strokeDasharray="5 5"
                label={{ value: `Límite: ${formatCurrency(Math.abs(creditLimit))}`, fill: '#ff453a', fontSize: 11 }}
              />
            )}
            <Bar
              yAxisId="left"
              dataKey="ingresos"
              name="Ingresos"
              fill="url(#gradIngresos)"
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            />
            <Bar
              yAxisId="left"
              dataKey="gastos"
              name="Gastos"
              fill="url(#gradGastos)"
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="acumulado"
              name="Acumulado"
              stroke="#5e5ce6"
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#5e5ce6', stroke: '#1c1c1e', strokeWidth: 2 }}
              activeDot={{ r: 6, fill: '#5e5ce6', stroke: '#1c1c1e', strokeWidth: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CashFlow;
