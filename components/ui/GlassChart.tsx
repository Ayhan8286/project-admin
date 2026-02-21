"use client";

import React from "react";
import {
    ResponsiveContainer,
    AreaChart as ReAreaChart,
    BarChart as ReBarChart,
    Area,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from "recharts";

/* ─────────────────────────────────────────────
   GLASS TOOLTIP
   Renders the custom tooltip in a glass card
───────────────────────────────────────────── */
interface GlassTooltipProps {
    active?: boolean;
    payload?: Array<{ name: string; value: number; color: string }>;
    label?: string;
}

function GlassTooltip({ active, payload, label }: GlassTooltipProps) {
    if (!active || !payload?.length) return null;
    return (
        <div
            style={{
                background: "rgba(15, 10, 40, 0.75)",
                backdropFilter: "blur(15px)",
                WebkitBackdropFilter: "blur(15px)",
                border: "0.5px solid rgba(255,255,255,0.10)",
                borderRadius: "0.65rem",
                padding: "10px 14px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            }}
        >
            <p style={{ color: "#94a3b8", fontSize: "0.72rem", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {label}
            </p>
            {payload.map((entry) => (
                <div key={entry.name} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: entry.color, boxShadow: `0 0 6px ${entry.color}` }} />
                    <span style={{ color: "#e2e8f0", fontSize: "0.82rem", fontWeight: 600 }}>
                        {entry.value}
                        {entry.name === "attendance" ? "%" : ""}
                    </span>
                    <span style={{ color: "#64748b", fontSize: "0.72rem" }}>{entry.name}</span>
                </div>
            ))}
        </div>
    );
}

/* ─────────────────────────────────────────────
   SHARED AXIS / GRID DEFAULTS
───────────────────────────────────────────── */
const sharedXAxis = (dataKey: string) => (
    <XAxis
        dataKey={dataKey}
        axisLine={false}
        tickLine={false}
        tick={{ fill: "#64748b", fontSize: 11, fontFamily: "inherit" }}
        dy={6}
    />
);

const sharedYAxis = (unit = "") => (
    <YAxis
        axisLine={false}
        tickLine={false}
        tick={{ fill: "#64748b", fontSize: 11, fontFamily: "inherit" }}
        width={32}
        tickFormatter={(v) => `${v}${unit}`}
    />
);

const sharedGrid = (
    <CartesianGrid
        horizontal={true}
        vertical={false}
        stroke="rgba(255,255,255,0.05)"
        strokeDasharray="4 6"
    />
);

const sharedTooltip = <Tooltip content={<GlassTooltip />} cursor={{ stroke: "rgba(139,92,246,0.15)", strokeWidth: 1 }} />;

/* ─────────────────────────────────────────────
   GLASS AREA CHART
───────────────────────────────────────────── */
interface AreaDataPoint {
    [key: string]: string | number;
}

interface GlassAreaChartProps {
    data: AreaDataPoint[];
    xKey: string;
    dataKey: string;
    /** Neon glow color as hex */
    color?: string;
    unit?: string;
    height?: number;
}

export function GlassAreaChart({
    data,
    xKey,
    dataKey,
    color = "#8b5cf6",
    unit = "",
    height = 200,
}: GlassAreaChartProps) {
    const gradientId = `area-grad-${dataKey}`;
    const filterId = `glow-${dataKey}`;

    return (
        <ResponsiveContainer width="100%" height={height}>
            <ReAreaChart data={data} margin={{ top: 10, right: 8, left: -8, bottom: 0 }}>
                <defs>
                    {/* Fading area gradient */}
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                        <stop offset="85%" stopColor={color} stopOpacity={0.04} />
                        <stop offset="100%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                    {/* Neon glow filter */}
                    <filter id={filterId} x="-20%" y="-50%" width="140%" height="200%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feFlood floodColor={color} floodOpacity="0.7" result="color" />
                        <feComposite in="color" in2="blur" operator="in" result="glow" />
                        <feMerge>
                            <feMergeNode in="glow" />
                            <feMergeNode in="glow" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {sharedGrid}
                {sharedXAxis(xKey)}
                {sharedYAxis(unit)}
                {sharedTooltip}

                <Area
                    type="monotone"
                    dataKey={dataKey}
                    stroke={color}
                    strokeWidth={3}
                    fill={`url(#${gradientId})`}
                    filter={`url(#${filterId})`}
                    dot={false}
                    activeDot={{ r: 5, fill: color, stroke: "rgba(255,255,255,0.3)", strokeWidth: 2 }}
                    isAnimationActive={true}
                    animationDuration={1500}
                    animationEasing="ease-out"
                />
            </ReAreaChart>
        </ResponsiveContainer>
    );
}

/* ─────────────────────────────────────────────
   GLASS BAR CHART
───────────────────────────────────────────── */
interface BarDataPoint {
    [key: string]: string | number;
}

interface GlassBarChartProps {
    data: BarDataPoint[];
    xKey: string;
    dataKey: string;
    color?: string;
    colorEnd?: string;
    unit?: string;
    height?: number;
}

export function GlassBarChart({
    data,
    xKey,
    dataKey,
    color = "#8b5cf6",
    colorEnd = "#4f46e5",
    unit = "",
    height = 200,
}: GlassBarChartProps) {
    const gradientId = `bar-grad-${dataKey}`;
    const filterId = `bar-glow-${dataKey}`;

    return (
        <ResponsiveContainer width="100%" height={height}>
            <ReBarChart data={data} margin={{ top: 10, right: 8, left: -8, bottom: 0 }} barCategoryGap="35%">
                <defs>
                    {/* Vertical bar gradient */}
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity={0.95} />
                        <stop offset="100%" stopColor={colorEnd} stopOpacity={0.5} />
                    </linearGradient>
                    {/* Subtle bar glow */}
                    <filter id={filterId} x="-30%" y="-20%" width="160%" height="200%">
                        <feGaussianBlur stdDeviation="2.5" result="blur" />
                        <feFlood floodColor={color} floodOpacity="0.5" result="color" />
                        <feComposite in="color" in2="blur" operator="in" result="glow" />
                        <feMerge>
                            <feMergeNode in="glow" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {sharedGrid}
                {sharedXAxis(xKey)}
                {sharedYAxis(unit)}
                {sharedTooltip}

                <Bar
                    dataKey={dataKey}
                    fill={`url(#${gradientId})`}
                    radius={[4, 4, 0, 0]}
                    filter={`url(#${filterId})`}
                    isAnimationActive={true}
                    animationDuration={1500}
                    animationEasing="ease-out"
                    maxBarSize={36}
                />
            </ReBarChart>
        </ResponsiveContainer>
    );
}
