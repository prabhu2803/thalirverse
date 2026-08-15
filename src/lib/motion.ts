import type { Transition, Variants } from 'framer-motion';

// Shared spring/easing tokens — the single source of the app's "playful &
// energetic" motion feel. Reuse these instead of inlining ad hoc durations
// per page, so every animation in the app moves the same way.
export const springSnappy: Transition = { type: 'spring', stiffness: 400, damping: 25 };
export const springBouncy: Transition = { type: 'spring', stiffness: 260, damping: 18 };
export const springSoft: Transition = { type: 'spring', stiffness: 300, damping: 30 };
export const easeOutStd: Transition = { duration: 0.4, ease: [0.16, 1, 0.3, 1] };

// Entrance — content fading/rising into place.
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: springSoft },
};

// Modal/card open — used in place of the old hand-rolled `fade-in` keyframe.
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: springSnappy },
  exit: { opacity: 0, scale: 0.97, transition: { duration: 0.15 } },
};

// Modal/card open — used in place of the old hand-rolled `slide-up` keyframe.
export const slideUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: springSnappy },
  exit: { opacity: 0, y: 8, transition: { duration: 0.15 } },
};

// Wrap a card-grid container in this, and each child in `fadeUp`, to get a
// cascading stagger-in instead of everything appearing at once.
export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

// Celebratory pop — badge unlocks, "you passed!" moments. Starts collapsed
// with a slight wobble, springs open with visible overshoot.
export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0, rotate: -8 },
  visible: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: { ...springBouncy, delay: 0.1 },
  },
};

// Short slide+fade for swapping content in place (quiz questions, wizard
// steps) — kept snappy on purpose so time-pressured flows don't feel laggy.
export const stepSlide: Variants = {
  enter: { opacity: 0, x: 20 },
  center: { opacity: 1, x: 0, transition: springSnappy },
  exit: { opacity: 0, x: -20, transition: { duration: 0.15 } },
};

// Spread these directly onto a motion element's props for the common
// hover-lift / tap-press idiom already used everywhere in the app —
// upgrades the existing `hover:-translate-y-0.5 active:scale-95` Tailwind
// pattern to a spring so it gets a touch of overshoot instead of a linear
// ease, without changing the visual language.
export const hoverLift = { whileHover: { y: -4 }, transition: springSnappy };
export const tapPress = { whileTap: { scale: 0.96 } };
