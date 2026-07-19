"use client";

import { m, useReducedMotion } from "framer-motion";
import { ShieldAlert, ShieldCheck, ShieldX } from "lucide-react";
import type { RiskTier } from "@/lib/engine/types";
import { TIER_META } from "@/lib/tier";

const TIER_ICON: Record<RiskTier, typeof ShieldCheck> = {
  safe: ShieldCheck,
  suspicious: ShieldAlert,
  dangerous: ShieldX,
};

const SIZE = 176;
const STROKE = 14;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function RiskGauge({ score, tier }: { score: number; tier: RiskTier }) {
  const shouldReduceMotion = useReducedMotion();
  const meta = TIER_META[tier];
  const Icon = TIER_ICON[tier];
  const offset = CIRCUMFERENCE * (1 - score / 100);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="-rotate-90">
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="var(--border)"
            strokeWidth={STROKE}
          />
          <m.circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={meta.colorVar}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            initial={{ strokeDashoffset: CIRCUMFERENCE }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: shouldReduceMotion ? 0.01 : 1, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <m.span
            className="text-4xl font-semibold tabular-nums"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: shouldReduceMotion ? 0 : 0.3, duration: 0.3 }}
          >
            {score}
          </m.span>
          <span className="text-xs text-muted-foreground">/ 100</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5" style={{ color: meta.colorVar }}>
        <Icon size={18} aria-hidden />
        <span className="text-sm font-medium text-foreground">{meta.label}</span>
      </div>
      <p className="max-w-[220px] text-center text-xs text-muted-foreground">{meta.description}</p>
    </div>
  );
}
