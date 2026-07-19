"use client";

import { m, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

export function FadeIn({
  children,
  delay = 0,
  className,
  y = 8,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  y?: number;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <m.div
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: shouldReduceMotion ? 0.01 : 0.35, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </m.div>
  );
}
