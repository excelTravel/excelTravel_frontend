import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';

export interface DonutSegment {
  value: number;
  color: string;
}

// A multi-segment ring — each segment sized to its share, animated in. Used for fleet composition
// (active / maintenance / retired) with live counts.
export function SegmentedDonut({
  segments,
  size = 128,
  children,
}: {
  segments: DonutSegment[];
  size?: number;
  children?: ReactNode;
}) {
  const reduce = useReducedMotion();
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;

  let offset = 0;
  const arcs = segments.map((seg, i) => {
    const len = (seg.value / total) * c;
    const arc = { len, offset, color: seg.color, key: i };
    offset += len;
    return arc;
  });

  return (
    <div className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--secondary))" strokeWidth={stroke} />
        {arcs.map((a) => (
          <motion.circle
            key={a.key}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={a.color}
            strokeWidth={stroke}
            strokeDasharray={`${a.len} ${c - a.len}`}
            strokeDashoffset={-a.offset}
            initial={{ opacity: reduce ? 1 : 0, strokeDasharray: reduce ? `${a.len} ${c - a.len}` : `0 ${c}` }}
            animate={{ opacity: 1, strokeDasharray: `${a.len} ${c - a.len}` }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: a.key * 0.12 }}
          />
        ))}
      </svg>
      <div className="absolute flex flex-col items-center">{children}</div>
    </div>
  );
}
