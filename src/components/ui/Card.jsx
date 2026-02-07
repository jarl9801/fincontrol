import { AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

const Card = ({ title, amount, icon: Icon, colorClass, subtext, alert, trend }) => {
  const isNegative = amount < 0;

  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="w-3 h-3" />;
    if (trend === 'down') return <TrendingDown className="w-3 h-3" />;
    return null;
  };

  const getTrendColor = () => {
    if (trend === 'up') return 'text-emerald-600';
    if (trend === 'down') return 'text-red-600';
    return 'text-slate-400';
  };

  return (
    <div className={`
      relative bg-white p-6 rounded-[16px] border transition-all duration-200
      ${alert
        ? 'border-red-200 shadow-lg'
        : 'border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300'
      }
      overflow-hidden
    `}
    style={{ boxShadow: alert ? '0 4px 6px -1px rgba(239, 68, 68, 0.1), 0 2px 4px -2px rgba(239, 68, 68, 0.1)' : undefined }}
    >
      {/* Alert Badge */}
      {alert && (
        <div className="absolute top-3 right-3">
          <div className="flex items-center gap-1 px-2 py-1 bg-red-50 rounded-full border border-red-100">
            <AlertTriangle className="w-3 h-3 text-red-600" />
            <span className="text-[10px] font-semibold text-red-600 uppercase">Alerta</span>
          </div>
        </div>
      )}

      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Label */}
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>

          {/* Amount */}
          <h3 className={`text-2xl font-bold ${isNegative ? 'text-red-600' : 'text-slate-800'}`}>
            {formatCurrency(amount)}
          </h3>

          {/* Subtext con trend */}
          {subtext && (
            <div className="flex items-center gap-2 mt-2">
              {trend && (
                <span className={`flex items-center gap-0.5 text-xs font-medium ${getTrendColor()}`}>
                  {getTrendIcon()}
                </span>
              )}
              <p className="text-xs text-slate-400">{subtext}</p>
            </div>
          )}
        </div>

        {/* Icon */}
        <div className={`
          p-3 rounded-[12px] ${colorClass} shadow-sm
          transform transition-transform duration-200 hover:scale-105
        `}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>

      {/* Decorative gradient line at bottom */}
      {alert && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-400 to-red-500" />
      )}
    </div>
  );
};

export default Card;
