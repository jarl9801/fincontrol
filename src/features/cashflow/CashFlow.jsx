import React, { useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import {
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const CashFlow = ({ transactions }) => {
  const [view, setView] = useState('monthly'); // monthly | weekly

  // Agrupar transacciones pagadas por período
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
          // Agrupar por semana (simplificado: cada 7 días desde inicio del mes)
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
    
    // Calcular flujo neto y acumulado
    let accumulated = 0;
    const data = Object.values(grouped)
      .sort((a, b) => a.period.localeCompare(b.period))
      .map(item => {
        item.neto = item.ingresos - item.gastos;
        accumulated += item.neto;
        item.acumulado = accumulated;
        
        // Formatear label
        if (view === 'monthly') {
          const [year, month] = item.period.split('-');
          const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
          item.label = `${monthNames[parseInt(month) - 1]} ${year}`;
        } else {
          item.label = item.period.replace(/-/g, ' ');
        }
        
        return item;
      });
    
    return data;
  };

  const cashFlowData = groupByPeriod();

  // Calcular resumen
  const lastPeriod = cashFlowData[cashFlowData.length - 1] || { ingresos: 0, gastos: 0, neto: 0, acumulado: 0 };
  const totalIncome = cashFlowData.reduce((sum, d) => sum + d.ingresos, 0);
  const totalExpenses = cashFlowData.reduce((sum, d) => sum + d.gastos, 0);
  const netCashFlow = totalIncome - totalExpenses;

  return (
    <div className="space-y-6">
      {/* Controles */}
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

      {/* Métricas de resumen */}
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
            {formatCurrency(Math.abs(netCashFlow))}
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Saldo Acumulado</h3>
            <DollarSign className={lastPeriod.acumulado >= 0 ? 'text-blue-500' : 'text-rose-500'} size={20} />
          </div>
          <p className={`text-2xl font-bold ${lastPeriod.acumulado >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
            {formatCurrency(Math.abs(lastPeriod.acumulado))}
          </p>
        </div>
      </div>

      {/* Gráfico de Flujo de Caja Acumulado */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Flujo de Caja Acumulado</h3>
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
            <YAxis tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(value) => formatCurrency(value)} />
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

      {/* Gráfico de Ingresos vs Gastos */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Ingresos vs Gastos por Período</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={cashFlowData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" angle={-45} textAnchor="end" height={80} />
            <YAxis tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(value) => formatCurrency(value)} />
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
