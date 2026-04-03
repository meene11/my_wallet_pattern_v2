"use client";

import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import type { AnalyzeResponse } from "@/lib/types";

interface Props {
  analysis: AnalyzeResponse;
}

const BRAND_COLORS = [
  "#1B2A4A", "#2C4A8A", "#3A6BC9", "#5B9BD5",
  "#1A6B5C", "#27AE60", "#5DEBB8", "#A8D8C8",
];

const EMOTION_COLORS: Record<string, string> = {
  스트레스: "#E74C3C",
  충동:     "#E67E22",
  보상:     "#F5A623",
  필요:     "#27AE60",
};

interface ChartEntry {
  name:  string;
  value: number;
}

function toChartData(ratio: Record<string, number>): ChartEntry[] {
  return Object.entries(ratio).map(([name, value]) => ({ name, value }));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, name, percent }: any) {
  if (percent < 0.08) return null;
  const RADIAN = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.6;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {name} {(percent * 100).toFixed(0)}%
    </text>
  );
}

export default function Charts({ analysis }: Props) {
  const catData     = toChartData(analysis.cat_ratios);
  const emotionData = toChartData(analysis.emotion_ratios);

  return (
    <div className="card mb-6 hover:scale-[1.005] transition-transform duration-200">
      <p className="card-title">📊 소비 패턴 시각화</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* 카테고리 파이차트 */}
        <div>
          <p className="text-xs font-semibold text-gray-400 mb-2 text-center">
            카테고리별 소비 비율
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={catData}
                cx="50%"
                cy="50%"
                outerRadius={90}
                innerRadius={40}
                dataKey="value"
                labelLine={false}
                label={CustomLabel}
              >
                {catData.map((_, i) => (
                  <Cell key={i} fill={BRAND_COLORS[i % BRAND_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => [`${v.toFixed(1)}%`, "비율"]} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 감정 바차트 */}
        <div>
          <p className="text-xs font-semibold text-gray-400 mb-2 text-center">
            감정별 소비 비율 (%)
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={emotionData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
              <Tooltip formatter={(v: number) => [`${v.toFixed(1)}%`, "비율"]} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {emotionData.map((entry, i) => (
                  <Cell key={i} fill={EMOTION_COLORS[entry.name] ?? "#8884d8"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
