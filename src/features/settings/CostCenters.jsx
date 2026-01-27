import React, { useState } from 'react';
import { TrendingDown, TrendingUp, TrendingUpDown, Edit2, Trash2, Plus, Package } from 'lucide-react';
import { COST_CENTERS, INCOME_CENTERS, generateCostCenterId } from '../../constants/costCenters';
import { formatCurrency } from '../../utils/formatters';

const CostCenters = () => {
  const [costCenters, setCostCenters] = useState(COST_CENTERS);
  const [incomeCenters, setIncomeCenters] = useState(INCOME_CENTERS);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newCenter, setNewCenter] = useState({
    name: '',
    type: 'Costos',
    budget: 0,
    responsible: ''
  });

  const handleAddCenter = () => {
    if (!newCenter.name.trim()) return;

    const center = {
      id: generateCostCenterId(costCenters),
      name: newCenter.name.trim(),
      type: newCenter.type,
      budget: parseFloat(newCenter.budget) || 0,
      spent: 0,
      responsible: newCenter.responsible.trim() || 'Por Asignar'
    };

    if (newCenter.type === 'Costos') {
      setCostCenters([...costCenters, center]);
    } else {
      setIncomeCenters([...incomeCenters, center]);
    }

    setNewCenter({ name: '', type: 'Costos', budget: 0, responsible: '' });
    setShowNewModal(false);
  };

  const handleDelete = (id, type) => {
    if (type === 'Costos') {
      setCostCenters(costCenters.filter(cc => cc.id !== id));
    } else {
      setIncomeCenters(incomeCenters.filter(cc => cc.id !== id));
    }
  };

  const getUtilization = (spent, budget) => {
    if (budget === 0) return 0;
    return ((spent / budget) * 100).toFixed(1);
  };

  const CostCenterRow = ({ center, onDelete }) => {
    const utilization = getUtilization(center.spent, center.budget);

    return (
      <tr className="border-b border-slate-100 hover:bg-slate-50">
        <td className="px-4 py-4 text-sm font-medium text-slate-600">{center.id}</td>
        <td className="px-4 py-4 text-sm font-medium text-slate-800">{center.name}</td>
        <td className="px-4 py-4">
          <span className="px-2 py-1 text-xs font-medium bg-rose-100 text-rose-700 rounded">
            {center.type}
          </span>
        </td>
        <td className="px-4 py-4 text-sm text-slate-600">{formatCurrency(center.budget)}</td>
        <td className="px-4 py-4 text-sm text-slate-400">-</td>
        <td className="px-4 py-4 text-sm font-medium text-rose-600">{formatCurrency(center.spent)}</td>
        <td className="px-4 py-4 text-sm text-slate-400">-</td>
        <td className="px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-600">{utilization}%</span>
            <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  utilization > 80 ? 'bg-rose-500' :
                  utilization > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(utilization, 100)}%` }}
              />
            </div>
          </div>
        </td>
        <td className="px-4 py-4 text-sm text-slate-600">{center.responsible}</td>
        <td className="px-4 py-4">
          <div className="flex items-center gap-1">
            <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
              <Edit2 size={14} />
            </button>
            <button
              onClick={() => onDelete(center.id, center.type)}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="space-y-6">
      {/* Cards de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Centro de Costos */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-rose-100 rounded-lg">
              <TrendingDown className="text-rose-600" size={20} />
            </div>
            <h3 className="font-bold text-rose-800">Centro de Costos</h3>
          </div>
          <p className="text-sm text-rose-600 mb-1">Registra solo <strong>GASTOS</strong></p>
          <p className="text-xs text-slate-500 mb-3">Presupuesto = Limite maximo de gastos</p>
          <p className="text-2xl font-bold text-rose-600">{costCenters.length} <span className="text-sm font-normal">activos</span></p>
        </div>

        {/* Centro de Ingresos */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <TrendingUp className="text-emerald-600" size={20} />
            </div>
            <h3 className="font-bold text-emerald-800">Centro de Ingresos</h3>
          </div>
          <p className="text-sm text-emerald-600 mb-1">Registra solo <strong>VENTAS</strong></p>
          <p className="text-xs text-slate-500 mb-3">Objetivo = Meta de ingresos a alcanzar</p>
          <p className="text-2xl font-bold text-emerald-600">{incomeCenters.length} <span className="text-sm font-normal">activos</span></p>
        </div>

        {/* Beneficios */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUpDown className="text-blue-600" size={20} />
            </div>
            <h3 className="font-bold text-blue-800">Beneficios (Calculado)</h3>
          </div>
          <p className="text-sm text-blue-600 mb-1 font-semibold">AUTOMATICO</p>
          <p className="text-xs text-slate-500 mb-3">Ingresos totales - Gastos totales</p>
          <p className="text-sm text-blue-500">Se calcula abajo</p>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex justify-end gap-3">
        <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors">
          <Package size={18} /> Generar Predefinidos
        </button>
        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-medium transition-colors"
        >
          <Plus size={18} /> Nuevo Centro
        </button>
      </div>

      {/* Tabla de Centros de Costos */}
      <div className="bg-rose-50 rounded-2xl p-6 border border-rose-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-rose-100 rounded-lg">
            <TrendingDown className="text-rose-600" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-rose-800">Centros de Costos</h3>
            <p className="text-sm text-rose-600">Solo registra GASTOS</p>
          </div>
        </div>

        <div className="bg-white rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Codigo</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Nombre</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Tipo</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Objetivo/Ppto</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Ingresos</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Gastos</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Beneficio</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Utilizacion</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Responsable</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {costCenters.map(center => (
                <CostCenterRow key={center.id} center={center} onDelete={handleDelete} />
              ))}
              {costCenters.length === 0 && (
                <tr>
                  <td colSpan="10" className="px-4 py-8 text-center text-slate-400">
                    No hay centros de costo definidos
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para nuevo centro */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-800">Nuevo Centro de Costo</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newCenter.name}
                  onChange={(e) => setNewCenter({ ...newCenter, name: e.target.value })}
                  placeholder="Nombre del centro"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                <select
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newCenter.type}
                  onChange={(e) => setNewCenter({ ...newCenter, type: e.target.value })}
                >
                  <option value="Costos">Centro de Costos (Gastos)</option>
                  <option value="Ingresos">Centro de Ingresos (Ventas)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Presupuesto/Objetivo</label>
                <input
                  type="number"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newCenter.budget}
                  onChange={(e) => setNewCenter({ ...newCenter, budget: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Responsable</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newCenter.responsible}
                  onChange={(e) => setNewCenter({ ...newCenter, responsible: e.target.value })}
                  placeholder="Nombre del responsable"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex gap-3 justify-end">
              <button
                onClick={() => setShowNewModal(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddCenter}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Crear Centro
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CostCenters;
