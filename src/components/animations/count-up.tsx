"use client";

import * as React from "react";
import { motion, useInView, useMotionValue, useSpring, useTransform } from "motion/react";

export function CountUp({
  value,
  duration = 1.2,
  className,
  suffix = "",
  prefix = "",
}: {
  value: number;
  duration?: number;
  className?: string;
  suffix?: string;
  prefix?: string;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const raw = useMotionValue(0);
  const spring = useSpring(raw, { stiffness: 90, damping: 22, mass: 0.6 });
  const display = useTransform(spring, (latest) =>
    `${prefix}${Math.round(latest).toLocaleString("en-US")}${suffix}`,
  );

  React.useEffect(() => {
    if (inView) raw.set(value);
  }, [inView, raw, value]);

  return (
    <span ref={ref} className={className}>
      <motion.span>{display}</motion.span>
    </span>
  );
}
