import { AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

const Card = ({ title, amount, icon: Icon, colorClass, subtext, alert }) => (
  <div className={`bg-white p-6 rounded-xl shadow-sm border ${alert ? 'border-rose-300 ring-2 ring-rose-200' : 'border-slate-100'} flex items-center justify-between relative overflow-hidden`}>
    {alert && (
      <div className="absolute top-2 right-2">
        <AlertTriangle className="w-5 h-5 text-rose-500" />
      </div>
    )}
    <div className="flex-1">
      <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
      <h3 className={`text-2xl font-bold ${amount < 0 ? 'text-rose-600' : 'text-slate-800'}`}>
        {formatCurrency(amount)}
      </h3>
      {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
    </div>
    <div className={`p-3 rounded-full ${colorClass}`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
  </div>
);

export default Card;
