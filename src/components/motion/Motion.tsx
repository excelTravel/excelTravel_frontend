import type { ReactNode } from 'react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { cn } from '@/lib/utils';
import { staggerContainer, riseItem, DUR, EASE_OUT } from '@/lib/motion';

// Reduced-motion fallback: a flat opacity fade with no positional movement, reused by every primitive.
const fadeOnly: Variants = {
  initial: { opacity: 0 },
  enter: { opacity: 1, transition: { duration: DUR.fast, ease: EASE_OUT } },
};

// Reveals its RevealItem children in a staggered sequence as the section enters.
export function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  const rm = useReducedMotion();
  return (
    <motion.div
      className={className}
      variants={rm ? { initial: {}, enter: {} } : staggerContainer}
      initial="initial"
      animate="enter"
    >
      {children}
    </motion.div>
  );
}

// A single revealed block; rises into place unless reduced motion is on (then it just fades).
export function RevealItem({ children, className }: { children: ReactNode; className?: string }) {
  const rm = useReducedMotion();
  return (
    <motion.div className={className} variants={rm ? fadeOnly : riseItem}>
      {children}
    </motion.div>
  );
}

// Interactive frosted card — subtle lift on hover and press-in on tap. Use for clickable cards.
export function MotionCard({
  children,
  className,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const rm = useReducedMotion();
  return (
    <motion.div
      onClick={onClick}
      whileHover={rm ? undefined : { y: -4 }}
      whileTap={rm ? undefined : { scale: 0.985 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={cn('glass rounded-2xl text-card-foreground shadow-sm', className)}
    >
      {children}
    </motion.div>
  );
}
