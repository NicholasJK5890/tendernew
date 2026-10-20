import React from 'react';

interface MilestoneWidgetProps {
  title?: string;
  metric?: string;
  description?: string;
  milestoneLabel?: string;
  startLabel?: string;
  endLabel?: string;
  percentage?: number; // 0 to 100
  secondaryTitle?: string;
  secondaryPercentage?: number;
}

export const MilestoneWidget: React.FC<MilestoneWidgetProps> = ({
  title = "Procurement Milestone Overview",
  metric = "₹18.5 Cr",
  description = "You've verified 75% of your mandatory tender compliance criteria. 1 critical alert pending review.",
  milestoneLabel = "Evaluation to next milestone",
  startLabel = "₹10 Cr",
  endLabel = "₹25 Cr",
  percentage = 68,
  secondaryTitle = "Statutory BIS Verification Rate",
  secondaryPercentage = 75
}) => {
  const totalBars = 26;
  const primaryFilledBars = Math.round((percentage / 100) * totalBars);
  const secondaryFilledBars = Math.round((secondaryPercentage / 100) * totalBars);

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)]">
      <div className="text-sm font-semibold text-slate-800 mb-1">{title}</div>
      <div className="text-2xl font-bold text-slate-900 mb-2">{metric}</div>
      <p className="text-xs text-slate-500 leading-relaxed mb-4">
        {description}
      </p>

      {/* Primary Vertical Bars Milestone */}
      <div className="mb-4">
        <div className="text-xs font-medium text-slate-600 mb-2">{milestoneLabel}</div>
        <div className="flex items-center gap-1.5 h-6">
          {Array.from({ length: totalBars }).map((_, idx) => (
            <div
              key={idx}
              className={`flex-1 h-full rounded-sm transition-colors duration-300 ${
                idx < primaryFilledBars
                  ? 'bg-[#7C6BC4]'
                  : 'bg-slate-100'
              }`}
            />
          ))}
        </div>
        <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1.5 font-medium">
          <span>{startLabel}</span>
          <span>{endLabel}</span>
        </div>
      </div>

      {/* Secondary Cyan Vertical Bars Milestone */}
      <div>
        <div className="text-xs font-medium text-slate-600 mb-2">{secondaryTitle}</div>
        <div className="flex items-center gap-1.5 h-5">
          {Array.from({ length: totalBars }).map((_, idx) => (
            <div
              key={idx}
              className={`flex-1 h-full rounded-sm transition-colors duration-300 ${
                idx < secondaryFilledBars
                  ? 'bg-[#38BDF8]'
                  : 'bg-slate-100'
              }`}
            />
          ))}
        </div>
        <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1.5 font-medium">
          <span>{secondaryPercentage}% Compliant</span>
          <span>100% Target</span>
        </div>
      </div>
    </div>
  );
};
