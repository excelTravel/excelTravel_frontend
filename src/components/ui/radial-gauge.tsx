import { motion, useReducedMotion } from 'framer-motion';
import { CountUp } from './count-up';

// Animated ring gauge — the arc sweeps to `value`% on mount. Used for fleet utilization.
export function RadialGauge({ value, label, size = 132 }: { value: number; label?: string; size?: number }) {
  const reduce = useReducedMotion();
  const compact = size < 120;
  const stroke = compact ? 8 : 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - value / 100);

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--secondary))" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="hsl(var(--teal))"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: reduce ? offset : c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={compact ? 'text-xl font-bold tabular-nums tracking-tight' : 'text-3xl font-bold tabular-nums tracking-tight'}>
          <CountUp value={value} format={(n) => `${Math.round(n)}%`} />
        </span>
        {label && (
          <span className="max-w-full truncate text-[9px] font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
        )}
      </div>
    </div>
  );
}
