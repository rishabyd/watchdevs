"use client";

import { motion, useSpring } from "@workspace/ui/adapters/motion";
import { useEffect, useState } from "react";

interface AnimatedCounterProps {
  value: number;
  className?: string;
}

export function AnimatedCounter({ value, className }: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const springValue = useSpring(0, { duration: 1500, bounce: 0 });

  useEffect(() => {
    springValue.set(value);

    const unsubscribe = springValue.on("change", (latest) => {
      setDisplayValue(Math.floor(latest));
    });

    return () => unsubscribe();
  }, [value, springValue]);

  return (
    <motion.span
      className={className}
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, type: "spring" }}
    >
      +{displayValue.toLocaleString()}
    </motion.span>
  );
}
