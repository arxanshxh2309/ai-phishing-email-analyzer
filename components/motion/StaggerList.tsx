"use client";

import { m, useReducedMotion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

const containerVariants: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

export function StaggerList({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <m.div initial="hidden" animate="show" variants={containerVariants} className={className}>
      {children}
    </m.div>
  );
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  const shouldReduceMotion = useReducedMotion();
  return (
    <m.div variants={shouldReduceMotion ? undefined : itemVariants} className={className}>
      {children}
    </m.div>
  );
}
