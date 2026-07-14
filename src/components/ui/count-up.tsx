import { useEffect, useState } from 'react';
import { animate, useReducedMotion } from 'framer-motion';

// Counts up to `value` on mount. Honors reduced motion (jumps straight to the final value).
export function CountUp({
  value,
  duration = 1.1,
  format,
}: {
  value: number;
  duration?: number;
  format?: (n: number) => string;
}) {
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(reduce ? value : 0);

  useEffect(() => {
    if (reduce) {
      setDisplay(value);
      return;
    }
    const controls = animate(0, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [value, duration, reduce]);

  return <>{format ? format(display) : Math.round(display).toLocaleString()}</>;
}
