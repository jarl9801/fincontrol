import { AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

const Card = ({ title, amount, icon: Icon, colorClass, subtext, alert, trend }) => {
  const isNegative = amount < 0;

  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="w-3.5 h-3.5" />;
    if (trend === 'down') return <TrendingDown className="w-3.5 h-3.5" />;
    return null;
  };

  const getTrendColor = () => {
    if (trend === 'up') return 'text-emerald-500';
    if (trend === 'down') return 'text-rose-500';
    return 'text-[#6868a0]';
  };

  return (
    <div className={`
      relative bg-[#1a1a2e] p-5 rounded-xl border transition-all duration-200
      ${alert
        ? 'border-l-4 border-l-rose-400 border-t-slate-200 border-r-slate-200 border-b-slate-200 shadow-sm'
        : 'border-[#2a2a4a] shadow-sm hover:shadow-md'
      }
    `}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-[#8888b0] uppercase tracking-wide mb-2">{title}</p>

          <h3 className={`text-2xl font-semibold tracking-tight ${isNegative ? 'text-rose-600' : 'text-[#d0d0e0]'}`}>
            {formatCurrency(amount)}
          </h3>

          {(subtext || trend) && (
            <div className="flex items-center gap-1.5 mt-2">
              {trend && (
                <span className={`flex items-center ${getTrendColor()}`}>
                  {getTrendIcon()}
                </span>
              )}
              {subtext && <p className="text-xs text-[#6868a0]">{subtext}</p>}
            </div>
          )}
        </div>

        <div className="p-2.5 rounded-lg bg-[#1e1e38]">
          <Icon className="w-5 h-5 text-[#9898b8]" />
        </div>
      </div>

      {alert && (
        <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-[#2a2a4a]">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
          <span className="text-xs font-medium text-rose-500">Requiere atención</span>
        </div>
      )}
    </div>
  );
};

export default Card;
