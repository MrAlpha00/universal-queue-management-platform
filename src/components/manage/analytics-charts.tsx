"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/card";
import type { AnalyticsSeries } from "@/services/management";

const statusColors: Record<string, string> = {
  BOOKED: "#a78bfa",
  CHECKED_IN: "#22d3ee",
  IN_PROGRESS: "#fbbf24",
  COMPLETED: "#34d399",
  CANCELLED: "#fb7185",
  EXPIRED: "#94a3b8",
  NO_SHOW: "#fb923c",
  RESCHEDULED: "#818cf8",
};

const tooltipStyle = {
  backgroundColor: "#111931",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 12,
  fontSize: 12,
  color: "#e2e8f0",
};

export function AnalyticsCharts({
  series,
  services,
  statuses,
}: {
  series: AnalyticsSeries[];
  services: Array<{ name: string; count: number }>;
  statuses: Array<{ status: string; count: number }>;
}) {
  const formatted = series.map((item) => ({
    ...item,
    label: item.date.slice(5),
  }));

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card className="p-5 lg:col-span-2">
        <h2 className="text-sm font-bold">Bookings over time</h2>
        <p className="mt-1 text-xs text-muted">Active versus completed and cancelled appointments.</p>
        <div className="mt-5 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={formatted} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="booked" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="completed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="booked" name="Active" stroke="#a78bfa" strokeWidth={2} fill="url(#booked)" />
              <Area type="monotone" dataKey="completed" name="Completed" stroke="#22d3ee" strokeWidth={2} fill="url(#completed)" />
              <Area type="monotone" dataKey="cancelled" name="Cancelled" stroke="#fb7185" strokeWidth={1.5} fillOpacity={0} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-sm font-bold">Top services</h2>
        <div className="mt-5 h-56">
          {services.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={services} layout="vertical" margin={{ left: 4, right: 16 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" horizontal={false} />
                <XAxis type="number" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={110} tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" name="Bookings" fill="#22d3ee" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="grid h-full place-items-center text-xs text-subtle">No booking data yet.</p>
          )}
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-sm font-bold">Status breakdown</h2>
        <div className="mt-5 h-56">
          {statuses.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statuses} dataKey="count" nameKey="status" innerRadius={52} outerRadius={82} paddingAngle={3}>
                  {statuses.map((entry) => (
                    <Cell key={entry.status} fill={statusColors[entry.status] ?? "#94a3b8"} stroke="#0b1120" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="grid h-full place-items-center text-xs text-subtle">No status data yet.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
