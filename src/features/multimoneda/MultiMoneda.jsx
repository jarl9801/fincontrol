import React, { useState, useEffect } from 'react';
import {
  DollarSign, RefreshCw, ArrowRightLeft, Save, Trash2, Info, Loader2, Plus
} from 'lucide-react';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, appId } from '../../services/firebase';
import { useToast } from '../../contexts/ToastContext';

const CURRENCIES = [
  { code: 'EUR', name: 'Euro', symbol: '\u20ac' },
  { code: 'USD', name: 'Dolar estadounidense', symbol: '$' },
  { code: 'COP', name: 'Peso colombiano', symbol: 'COL$' },
];

const DEFAULT_RATES = {
  'EUR/USD': 1.08,
  'EUR/COP': 4500,
};

const CURRENCY_PAIRS = ['EUR/USD', 'EUR/COP', 'USD/COP'];

const MultiMoneda = ({ user }) => {
  const { showToast } = useToast();
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [form, setForm] = useState({ pair: 'EUR/USD', rate: '' });

  // Converter state
  const [converter, setConverter] = useState({
    amount: '',
    from: 'EUR',
    to: 'USD',
  });

  const collectionPath = `artifacts/${appId}/public/data/exchangeRates`;

  useEffect(() => {
    const ref = collection(db, collectionPath);
    const unsubscribe = onSnapshot(ref, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setRates(data);
      setLoading(false);
    }, (error) => {
      console.error('Error loading exchange rates:', error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const getRate = (pair) => {
    const stored = rates.find((r) => r.pair === pair);
    if (stored) return stored.rate;
    return DEFAULT_RATES[pair] || null;
  };

  const handleSaveRate = async () => {
    const rateValue = parseFloat(form.rate);
    if (!rateValue || rateValue <= 0) {
      showToast('Ingresa una tasa valida', 'error');
      return;
    }
    setSaving(true);
    try {
      const existing = rates.find((r) => r.pair === form.pair);
      if (existing) {
        await updateDoc(doc(db, collectionPath, existing.id), {
          rate: rateValue,
          updatedAt: serverTimestamp(),
          updatedBy: user?.email || 'unknown',
        });
      } else {
        await addDoc(collection(db, collectionPath), {
          pair: form.pair,
          rate: rateValue,
          updatedAt: serverTimestamp(),
          updatedBy: user?.email || 'unknown',
        });
      }
      showToast('Tasa de cambio guardada', 'success');
      setForm({ ...form, rate: '' });
    } catch (err) {
      console.error(err);
      showToast('Error al guardar la tasa', 'error');
    }
    setSaving(false);
  };

  const handleDeleteRate = async (id) => {
    try {
      await deleteDoc(doc(db, collectionPath, id));
      showToast('Tasa eliminada', 'success');
    } catch (err) {
      console.error(err);
      showToast('Error al eliminar', 'error');
    }
  };

  const convertAmount = () => {
    const amount = parseFloat(converter.amount);
    if (!amount || converter.from === converter.to) return amount || 0;

    const { from, to } = converter;

    // Try direct pair
    const directPair = `${from}/${to}`;
    const directRate = getRate(directPair);
    if (directRate) return amount * directRate;

    // Try inverse pair
    const inversePair = `${to}/${from}`;
    const inverseRate = getRate(inversePair);
    if (inverseRate) return amount / inverseRate;

    // Try through EUR
    if (from !== 'EUR' && to !== 'EUR') {
      const fromToEur = getRate(`EUR/${from}`);
      const eurToTarget = getRate(`EUR/${to}`);
      if (fromToEur && eurToTarget) {
        return (amount / fromToEur) * eurToTarget;
      }
    }

    return null;
  };

  const convertedAmount = convertAmount();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-[#0a84ff] animate-spin" />
        <span className="ml-3 text-[#8e8e93]">Cargando tasas de cambio...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-[rgba(191,90,242,0.12)] rounded-xl">
          <DollarSign className="text-[#bf5af2]" size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[#e5e5ea]">Multi-Moneda</h2>
          <p className="text-sm text-[#8e8e93]">Gestiona tasas de cambio y convierte entre monedas</p>
        </div>
      </div>

      {/* Current Rates Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {CURRENCY_PAIRS.map((pair) => {
          const rate = getRate(pair);
          const storedRate = rates.find((r) => r.pair === pair);
          return (
            <div key={pair} className="bg-[#1c1c1e] rounded-xl p-5 shadow-sm border border-[rgba(255,255,255,0.08)]">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-[#8e8e93] uppercase tracking-wide">{pair}</h3>
                <ArrowRightLeft className="text-[#bf5af2]" size={18} />
              </div>
              <p className="text-2xl font-bold text-[#e5e5ea]">
                {rate ? rate.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : '—'}
              </p>
              <p className="text-xs text-[#636366] mt-1">
                {storedRate
                  ? `Actualizado: ${storedRate.updatedAt?.toDate?.()?.toLocaleDateString('es-ES') || 'Reciente'}`
                  : rate ? 'Tasa por defecto' : 'Sin datos'
                }
              </p>
            </div>
          );
        })}
      </div>

      {/* Rate Entry Form */}
      <div className="bg-[#1c1c1e] rounded-2xl p-6 shadow-sm border border-[rgba(255,255,255,0.08)]">
        <h3 className="text-lg font-bold text-[#e5e5ea] mb-4">Agregar / Actualizar Tasa</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-[#c7c7cc] mb-1">Par de monedas</label>
            <select
              className="w-full px-4 py-2.5 bg-[#2c2c2e] border border-[rgba(255,255,255,0.14)] rounded-lg text-[#e5e5ea] outline-none focus:ring-2 focus:ring-[#bf5af2]"
              value={form.pair}
              onChange={(e) => setForm({ ...form, pair: e.target.value })}
            >
              {CURRENCY_PAIRS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#c7c7cc] mb-1">Tasa de cambio</label>
            <input
              type="number"
              step="0.0001"
              className="w-full px-4 py-2.5 bg-[#2c2c2e] border border-[rgba(255,255,255,0.14)] rounded-lg text-[#e5e5ea] outline-none focus:ring-2 focus:ring-[#bf5af2]"
              value={form.rate}
              onChange={(e) => setForm({ ...form, rate: e.target.value })}
              placeholder={`Ej: ${DEFAULT_RATES[form.pair] || '1.00'}`}
            />
          </div>
          <div>
            <button
              onClick={handleSaveRate}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#bf5af2] hover:bg-[#a349d6] text-white rounded-lg font-medium transition-colors disabled:opacity-50 w-full justify-center"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {saving ? 'Guardando...' : 'Guardar Tasa'}
            </button>
          </div>
        </div>
      </div>

      {/* Exchange Rates Table */}
      <div className="bg-[#1c1c1e] rounded-2xl p-6 shadow-sm border border-[rgba(255,255,255,0.08)]">
        <h3 className="text-lg font-bold text-[#e5e5ea] mb-4">Tasas Guardadas</h3>
        {rates.length === 0 ? (
          <div className="text-center py-8">
            <RefreshCw className="mx-auto text-[#48484a] mb-3" size={32} />
            <p className="text-[#8e8e93]">No hay tasas guardadas. Se usan las tasas por defecto.</p>
            <p className="text-xs text-[#636366] mt-1">EUR/USD = 1.08 | EUR/COP = 4,500</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.06)]">
                  <th className="pb-3 text-xs font-semibold text-[#8e8e93] uppercase tracking-wide">Par</th>
                  <th className="pb-3 text-xs font-semibold text-[#8e8e93] uppercase tracking-wide">Tasa</th>
                  <th className="pb-3 text-xs font-semibold text-[#8e8e93] uppercase tracking-wide">Ultima actualizacion</th>
                  <th className="pb-3 text-xs font-semibold text-[#8e8e93] uppercase tracking-wide">Actualizado por</th>
                  <th className="pb-3 text-xs font-semibold text-[#8e8e93] uppercase tracking-wide text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {rates.map((r) => (
                  <tr key={r.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.02)]">
                    <td className="py-3 text-[#e5e5ea] font-medium">{r.pair}</td>
                    <td className="py-3 text-[#e5e5ea]">
                      {r.rate?.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                    </td>
                    <td className="py-3 text-[#8e8e93] text-sm">
                      {r.updatedAt?.toDate?.()?.toLocaleString('es-ES') || '—'}
                    </td>
                    <td className="py-3 text-[#8e8e93] text-sm">{r.updatedBy || '—'}</td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => handleDeleteRate(r.id)}
                        className="p-2 hover:bg-[rgba(255,69,58,0.12)] rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="text-[#ff453a]" size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Currency Converter */}
      <div className="bg-[#1c1c1e] rounded-2xl p-6 shadow-sm border border-[rgba(255,255,255,0.08)]">
        <h3 className="text-lg font-bold text-[#e5e5ea] mb-4">Calculadora de Conversion</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-[#c7c7cc] mb-1">Monto</label>
            <input
              type="number"
              step="0.01"
              className="w-full px-4 py-2.5 bg-[#2c2c2e] border border-[rgba(255,255,255,0.14)] rounded-lg text-[#e5e5ea] outline-none focus:ring-2 focus:ring-[#bf5af2]"
              value={converter.amount}
              onChange={(e) => setConverter({ ...converter, amount: e.target.value })}
              placeholder="1000.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#c7c7cc] mb-1">De</label>
            <select
              className="w-full px-4 py-2.5 bg-[#2c2c2e] border border-[rgba(255,255,255,0.14)] rounded-lg text-[#e5e5ea] outline-none focus:ring-2 focus:ring-[#bf5af2]"
              value={converter.from}
              onChange={(e) => setConverter({ ...converter, from: e.target.value })}
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#c7c7cc] mb-1">A</label>
            <select
              className="w-full px-4 py-2.5 bg-[#2c2c2e] border border-[rgba(255,255,255,0.14)] rounded-lg text-[#e5e5ea] outline-none focus:ring-2 focus:ring-[#bf5af2]"
              value={converter.to}
              onChange={(e) => setConverter({ ...converter, to: e.target.value })}
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
              ))}
            </select>
          </div>
          <div className="bg-[#2c2c2e] rounded-lg p-3 border border-[rgba(255,255,255,0.08)]">
            <p className="text-xs text-[#8e8e93] mb-1">Resultado</p>
            <p className="text-xl font-bold text-[#30d158]">
              {converter.amount && convertedAmount !== null
                ? `${CURRENCIES.find((c) => c.code === converter.to)?.symbol || ''} ${convertedAmount.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : '—'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-[rgba(10,132,255,0.08)] border border-[rgba(10,132,255,0.2)] rounded-xl p-4 flex items-start gap-3">
        <Info className="text-[#0a84ff] flex-shrink-0 mt-0.5" size={20} />
        <div>
          <p className="text-sm text-[#0a84ff] font-medium">Soporte multi-moneda en transacciones</p>
          <p className="text-xs text-[#8e8e93] mt-1">
            En una futura actualizacion se podra asignar una moneda a cada transaccion y ver los reportes convertidos automaticamente a EUR (moneda base). Por ahora, las tasas se pueden usar como referencia para conversiones manuales.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MultiMoneda;
