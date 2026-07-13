import type { Variants, Transition } from 'framer-motion';

// One shared motion vocabulary so every animation across the app reads with the same rhythm.
// Durations sit in the 150–300ms band; exits are shorter than enters; transform/opacity only.

export const EASE_OUT = [0.22, 1, 0.36, 1] as const; // expressive ease-out for entrances
export const EASE_IN = [0.4, 0, 1, 1] as const; // quick ease-in for exits

export const DUR = { fast: 0.18, base: 0.28, slow: 0.4 } as const;

// Page-level transition on route change: content lifts in, and leaves upward (forward-motion feel).
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  enter: { opacity: 1, y: 0, transition: { duration: DUR.base, ease: EASE_OUT } },
  exit: { opacity: 0, y: -8, transition: { duration: DUR.fast, ease: EASE_IN } },
};

// Container that reveals its children in sequence (30–50ms apart per the motion guidelines).
export const staggerContainer: Variants = {
  initial: {},
  enter: { transition: { staggerChildren: 0.05, delayChildren: 0.04 } },
};

// Standard "section rises into place" item — pair with staggerContainer.
export const riseItem: Variants = {
  initial: { opacity: 0, y: 14 },
  enter: { opacity: 1, y: 0, transition: { duration: DUR.base, ease: EASE_OUT } },
};

// Gentle spring for interactive lift/press on cards and buttons.
export const springSoft: Transition = { type: 'spring', stiffness: 400, damping: 30 };
