import React from 'react';
import { Card } from './Card';
import { clsx } from 'clsx';
import { TrendingUp, TrendingDown } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  subtitle?: string;
  icon?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  isPositive = true,
  subtitle,
  icon,
}) => {
  return (
    <Card hoverEffect className="relative overflow-hidden p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </span>
        {icon && (
          <div className="p-2.5 rounded-lg bg-primary-light text-primary flex items-center justify-center">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          {value}
        </span>
        {change && (
          <span
            className={clsx(
              'inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full',
              isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            )}
          >
            {isPositive ? (
              <TrendingUp className="w-3 h-3 mr-1 inline" />
            ) : (
              <TrendingDown className="w-3 h-3 mr-1 inline" />
            )}
            {change}
          </span>
        )}
      </div>

      {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
    </Card>
  );
};
