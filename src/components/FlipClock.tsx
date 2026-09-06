import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface FlipUnitProps {
  current: string;
  previous: string;
  size?: 'xs' | 'sm' | 'md';
  variant?: 'white' | 'emerald';
}

const FlipDigitCard: React.FC<FlipUnitProps> = ({ current, previous, size = 'sm', variant = 'white' }) => {
  const isFlipping = current !== previous;

  // Size dimensions
  const sizeStyles = {
    xs: {
      card: 'w-4 h-6 text-xs',
      digitHeight: 'h-3',
      textTop: 'translate-y-[0px]',
      textBottom: '-translate-y-[12px]',
      notch: 'w-0.5 h-1',
    },
    sm: {
      card: 'w-5 sm:w-6 h-7 sm:h-8 text-xs sm:text-sm',
      digitHeight: 'h-3.5 sm:h-4',
      textTop: 'translate-y-[0px]',
      textBottom: '-translate-y-[14px] sm:-translate-y-[16px]',
      notch: 'w-0.5 h-1.5',
    },
    md: {
      card: 'w-7 sm:w-8 h-9 sm:h-10 text-sm sm:text-base',
      digitHeight: 'h-4.5 sm:h-5',
      textTop: 'translate-y-[0px]',
      textBottom: '-translate-y-[18px] sm:-translate-y-[20px]',
      notch: 'w-0.5 h-1.5',
    },
  }[size];

  const colorStyles =
    variant === 'white'
      ? {
          card: 'bg-[#1E2923] text-white border-white/20',
          topBg: 'bg-[#2A3831] border-b border-black/50',
          bottomBg: 'bg-[#1A2520]',
          flipBg: 'bg-[#2F3E37] border-b border-black/60',
        }
      : {
          card: 'bg-[#12201B] dark:bg-[#0B1512] text-emerald-300 dark:text-[#6EE7B7] border-emerald-900/50 dark:border-[#24453A]',
          topBg: 'bg-[#182C25] dark:bg-[#11221C] border-b border-black/40',
          bottomBg: 'bg-[#12201B] dark:bg-[#0B1512]',
          flipBg: 'bg-[#1A3029] dark:bg-[#142821] border-b border-black/50',
        };

  return (
    <div
      className={`relative ${sizeStyles.card} font-mono font-bold select-none rounded-[4px] shadow-sm flex flex-col justify-between overflow-hidden ${colorStyles.card}`}
      style={{ perspective: '300px' }}
    >
      {/* Top Half (Static - New/Current Value) */}
      <div
        className={`w-full ${sizeStyles.digitHeight} overflow-hidden ${colorStyles.topBg} flex justify-center items-start pt-[1px] relative`}
      >
        <span className={sizeStyles.textTop}>{current}</span>
        {/* Subtle highlight gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
      </div>

      {/* Bottom Half (Static - New/Current Value) */}
      <div
        className={`w-full ${sizeStyles.digitHeight} overflow-hidden ${colorStyles.bottomBg} flex justify-center items-end pb-[1px] relative`}
      >
        <span className={sizeStyles.textBottom}>{current}</span>
        {/* Subtle bottom shadow */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent pointer-events-none" />
      </div>

      {/* Animated Flipping Flap (When digit changes) */}
      <AnimatePresence mode="popLayout">
        {isFlipping && (
          <motion.div
            key={previous + '->' + current}
            initial={{ rotateX: 0 }}
            animate={{ rotateX: -180 }}
            transition={{ duration: 0.35, ease: [0.45, 0.05, 0.55, 0.95] }}
            style={{
              transformOrigin: 'bottom',
              transformStyle: 'preserve-3d',
              backfaceVisibility: 'hidden',
            }}
            className={`absolute top-0 left-0 right-0 ${sizeStyles.digitHeight} overflow-hidden ${colorStyles.flipBg} flex justify-center items-start pt-[1px] z-20`}
          >
            <span className={sizeStyles.textTop}>{previous}</span>
            <div className="absolute inset-0 bg-gradient-to-b from-white/25 to-black/40 pointer-events-none" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Center Hinge Seam & Side Notches */}
      <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-black/75 z-30 pointer-events-none" />
      <div className={`absolute top-1/2 -left-0.5 -translate-y-1/2 ${sizeStyles.notch} bg-black/70 rounded-r-full z-30`} />
      <div className={`absolute top-1/2 -right-0.5 -translate-y-1/2 ${sizeStyles.notch} bg-black/70 rounded-l-full z-30`} />
    </div>
  );
};

interface FlipPairProps {
  value: string;
  label?: string;
  size?: 'xs' | 'sm' | 'md';
  variant?: 'white' | 'emerald';
}

const FlipPair: React.FC<FlipPairProps> = ({ value, label, size = 'sm', variant = 'white' }) => {
  const formatted = value.padStart(2, '0');
  const d0 = formatted[0];
  const d1 = formatted[1];

  const prevRef = useRef({ d0, d1 });
  const [prev, setPrev] = useState({ d0, d1 });

  useEffect(() => {
    if (prevRef.current.d0 !== d0 || prevRef.current.d1 !== d1) {
      setPrev(prevRef.current);
      prevRef.current = { d0, d1 };
    }
  }, [d0, d1]);

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-[2px]">
        <FlipDigitCard current={d0} previous={prev.d0} size={size} variant={variant} />
        <FlipDigitCard current={d1} previous={prev.d1} size={size} variant={variant} />
      </div>
      {label && (
        <span className="text-[9px] font-sans font-bold tracking-wider text-white/80 uppercase mt-1 scale-90">
          {label}
        </span>
      )}
    </div>
  );
};

export interface FlipClockProps {
  size?: 'xs' | 'sm' | 'md';
  showSeconds?: boolean;
  showLabels?: boolean;
  showTimezone?: boolean;
  variant?: 'white' | 'emerald';
  className?: string;
}

export const FlipClock: React.FC<FlipClockProps> = ({
  size = 'sm',
  showSeconds = true,
  showLabels = false,
  showTimezone = true,
  variant = 'white',
  className = '',
}) => {
  const [time, setTime] = useState(() => {
    const now = new Date();
    return {
      hours: String(now.getHours()).padStart(2, '0'),
      minutes: String(now.getMinutes()).padStart(2, '0'),
      seconds: String(now.getSeconds()).padStart(2, '0'),
    };
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setTime({
        hours: String(now.getHours()).padStart(2, '0'),
        minutes: String(now.getMinutes()).padStart(2, '0'),
        seconds: String(now.getSeconds()).padStart(2, '0'),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const isWhite = variant === 'white';

  return (
    <div
      className={`inline-flex items-center gap-1.5 p-1 sm:p-1.5 rounded-xl bg-white/25 dark:bg-black/60 border border-white/30 dark:border-white/20 text-white shadow-xs ${className}`}
      title="Jam Real-time (WIB)"
    >
      {/* Hours */}
      <FlipPair value={time.hours} label={showLabels ? 'JAM' : undefined} size={size} variant={variant} />

      {/* Colon Separator 1 */}
      <div className="flex flex-col gap-1 py-1 px-0.5 text-white font-bold select-none">
        <span className="w-1 h-1 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)] animate-pulse" />
        <span className="w-1 h-1 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)] animate-pulse" />
      </div>

      {/* Minutes */}
      <FlipPair value={time.minutes} label={showLabels ? 'MENIT' : undefined} size={size} variant={variant} />

      {/* Seconds (Optional) */}
      {showSeconds && (
        <>
          {/* Colon Separator 2 */}
          <div className="flex flex-col gap-1 py-1 px-0.5 text-white font-bold select-none">
            <span className="w-1 h-1 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)] animate-pulse" />
            <span className="w-1 h-1 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)] animate-pulse" />
          </div>

          <FlipPair value={time.seconds} label={showLabels ? 'DETIK' : undefined} size={size} variant={variant} />
        </>
      )}

      {/* Timezone Badge */}
      {showTimezone && (
        <span className="ml-1 text-[10px] font-mono font-bold text-white tracking-tight select-none">
          WIB
        </span>
      )}
    </div>
  );
};
