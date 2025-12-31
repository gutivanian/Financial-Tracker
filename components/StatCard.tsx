import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  color?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'primary',
}) => {
  const colorClasses = {
    primary: 'from-primary-600/20 to-primary-700/5 border-primary-600/30',
    success: 'from-success/20 to-success/5 border-success/30',
    warning: 'from-warning/20 to-warning/5 border-warning/30',
    danger: 'from-danger/20 to-danger/5 border-danger/30',
    info: 'from-info/20 to-info/5 border-info/30',
  };

  const iconColorClasses = {
    primary: 'bg-primary-600/20 text-primary-400',
    success: 'bg-success/20 text-success',
    warning: 'bg-warning/20 text-warning',
    danger: 'bg-danger/20 text-danger',
    info: 'bg-info/20 text-info',
  };

  return (
    <div
      className={`
        bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses] || colorClasses.primary}
        rounded-lg p-6 border hover:border-opacity-60 transition-all duration-200
        hover:shadow-lg hover:scale-[1.02]
      `}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className={`
            w-12 h-12 rounded-lg flex items-center justify-center
            ${iconColorClasses[color as keyof typeof iconColorClasses] || iconColorClasses.primary}
          `}
        >
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <span
            className={`
              text-sm font-medium px-2 py-1 rounded
              ${
                trend.isPositive
                  ? 'bg-success/20 text-success'
                  : 'bg-danger/20 text-danger'
              }
            `}
          >
            {trend.isPositive ? '+' : ''}{trend.value}
          </span>
        )}
      </div>
      <div>
        <p className="text-sm text-dark-400 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-white mb-1">{value}</h3>
        {subtitle && <p className="text-xs text-dark-400">{subtitle}</p>}
      </div>
    </div>
  );
};

export default StatCard;
