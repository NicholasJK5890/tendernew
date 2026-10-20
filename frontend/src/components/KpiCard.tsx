import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: string | number;
  trend?: string;
  trendType?: 'positive' | 'negative' | 'neutral';
  caption?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  trend,
  trendType = 'positive',
  caption
}) => {
  const isPositive = trendType === 'positive';
  const isNegative = trendType === 'negative';

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_20px_-4px_rgba(124,107,196,0.12)] transition-all duration-200">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-slate-500">{label}</span>
        {trend && (
          <span
            className={`inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
              isPositive
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                : isNegative
                ? 'bg-rose-50 text-rose-600 border border-rose-100'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {isPositive ? (
              <ArrowUpRight className="w-3.5 h-3.5" />
            ) : isNegative ? (
              <ArrowDownRight className="w-3.5 h-3.5" />
            ) : null}
            {trend}
          </span>
        )}
      </div>

      <div className="text-2xl font-bold tracking-tight text-slate-900 mb-1">
        {value}
      </div>

      {caption && (
        <div className="text-xs text-slate-400 font-normal">
          {caption}
        </div>
      )}
    </div>
  );
};
