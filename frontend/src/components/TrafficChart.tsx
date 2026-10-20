import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react';

interface DataPoint {
  time: string;
  verified: number;
  compliant: number;
  qualified: number;
  baseline: number;
}

const defaultData: DataPoint[] = [
  { time: '0', verified: 17, compliant: 24, qualified: 19, baseline: 11 },
  { time: '5K', verified: 16, compliant: 15, qualified: 16, baseline: 10 },
  { time: '10K', verified: 11, compliant: 14, qualified: 13, baseline: 8 },
  { time: '15K', verified: 12, compliant: 16, qualified: 15, baseline: 9 },
  { time: '20K', verified: 17, compliant: 15, qualified: 14, baseline: 8 },
  { time: '25K', verified: 19, compliant: 13, qualified: 14, baseline: 7 },
  { time: '30K', verified: 15, compliant: 13, qualified: 13, baseline: 7 },
  { time: '35K', verified: 13, compliant: 12, qualified: 13, baseline: 7 },
  { time: '40K', verified: 18, compliant: 15, qualified: 14, baseline: 8 },
  { time: '45K', verified: 17, compliant: 16, qualified: 14, baseline: 8 },
  { time: '50K', verified: 12, compliant: 18, qualified: 14, baseline: 8 },
];

export const TrafficChart: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState('Jun 2026');

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)]">
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-100/80 gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Impression & Data Traffics</h3>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-2">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">86%</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                <TrendingUp className="w-3 h-3" />
                32% Summary of analytics
              </span>
            </div>
            <div className="h-8 w-px bg-slate-200 hidden sm:block" />
            <div className="hidden sm:block">
              <div className="text-2xl font-bold text-[#7C6BC4]">₹18.5 Cr</div>
              <div className="text-[11px] text-slate-400 font-normal">₹2.4 Cr saved via fraud detection</div>
            </div>
          </div>
        </div>

        {/* Month Selector */}
        <div className="flex items-center gap-1 bg-slate-50 border border-slate-200/80 rounded-xl px-2 py-1 text-xs font-medium text-slate-700">
          <button
            onClick={() => setCurrentMonth('May 2026')}
            className="p-1 hover:bg-slate-200/60 rounded-md transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5 text-slate-500" />
          </button>
          <span className="px-2 font-semibold text-slate-800">{currentMonth}</span>
          <button
            onClick={() => setCurrentMonth('Jul 2026')}
            className="p-1 hover:bg-slate-200/60 rounded-md transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-64 w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={defaultData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94A3B8', fontSize: 11 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94A3B8', fontSize: 11 }}
              domain={[0, 30]}
              ticks={[0, 5, 10, 15, 20, 25, 30]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1E293B',
                borderRadius: '12px',
                border: 'none',
                color: '#FFFFFF',
                fontSize: '12px',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)'
              }}
              labelStyle={{ color: '#94A3B8', fontWeight: 600, marginBottom: '4px' }}
            />
            <Line
              type="monotone"
              dataKey="verified"
              name="Verified Claims"
              stroke="#7C6BC4"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, fill: '#7C6BC4' }}
            />
            <Line
              type="monotone"
              dataKey="compliant"
              name="Compliant Bids"
              stroke="#38BDF8"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, fill: '#38BDF8' }}
            />
            <Line
              type="monotone"
              dataKey="qualified"
              name="Qualified Bidders"
              stroke="#22C55E"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, fill: '#22C55E' }}
            />
            <Line
              type="monotone"
              dataKey="baseline"
              name="Market Baseline"
              stroke="#F59E0B"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, fill: '#F59E0B' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend matching screenshot dots */}
      <div className="flex flex-wrap items-center justify-center gap-6 mt-4 pt-3 border-t border-slate-50 text-xs text-slate-600 font-medium">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-sm bg-[#7C6BC4]" />
          <span>Verified Claims</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-sm bg-[#38BDF8]" />
          <span>Compliant Bids</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-sm bg-[#22C55E]" />
          <span>Qualified Bidders</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-sm bg-[#F59E0B]" />
          <span>Market Baseline</span>
        </div>
      </div>
    </div>
  );
};
