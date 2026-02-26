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
    if (trend === 'up') return 'text-[#30d158]';
    if (trend === 'down') return 'text-[#ff453a]';
    return 'text-[#636366]';
  };

  return (
    <div className={`
      relative p-5 rounded-2xl border transition-all duration-200
      ${alert
        ? 'border-l-4 border-l-[#ff453a] border-[rgba(255,255,255,0.08)] shadow-sm'
        : 'border-[rgba(255,255,255,0.08)] shadow-sm hover:shadow-md'
      }
    `}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-[#8e8e93] uppercase tracking-wide mb-2">{title}</p>

          <h3 className={`text-2xl font-semibold tracking-tight ${isNegative ? 'text-[#ff453a]' : 'text-[#e5e5ea]'}`}>
            {formatCurrency(amount)}
          </h3>

          {(subtext || trend) && (
            <div className="flex items-center gap-1.5 mt-2">
              {trend && (
                <span className={`flex items-center ${getTrendColor()}`}>
                  {getTrendIcon()}
                </span>
              )}
              {subtext && <p className="text-xs text-[#636366]">{subtext}</p>}
            </div>
          )}
        </div>

        <div className="p-2.5 rounded-lg bg-[#2c2c2e]">
          <Icon className="w-5 h-5 text-[#98989d]" />
        </div>
      </div>

      {alert && (
        <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-[rgba(255,255,255,0.08)]">
          <AlertTriangle className="w-3.5 h-3.5 text-[#ff453a]" />
          <span className="text-xs font-medium text-[#ff453a]">Requiere atención</span>
        </div>
      )}
    </div>
  );
};

export default Card;
