import React, { useEffect, useState } from 'react';

export interface AnalogClockProps {
  size?: number; // diameter in px (default 32)
  showDigitalText?: boolean;
  showTimezone?: boolean;
  className?: string;
}

export const AnalogClock: React.FC<AnalogClockProps> = ({
  size = 32,
  showDigitalText = true,
  showTimezone = true,
  className = '',
}) => {
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const updateTime = () => setTime(new Date());
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const hours = time.getHours();
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();

  // Angle calculations (in degrees)
  const secondAngle = seconds * 6; // 360 / 60
  const minuteAngle = minutes * 6 + (seconds / 60) * 6; // 360 / 60 + smooth
  const hourAngle = (hours % 12) * 30 + (minutes / 60) * 30; // 360 / 12 + smooth

  // Formatted digital string
  const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const center = size / 2;
  const radius = center - 2;

  return (
    <div
      className={`inline-flex items-center gap-2 select-none ${className}`}
      title={`Jam Real-time: ${timeStr} WIB`}
    >
      {/* Analog Clock Face (SVG) */}
      <div
        className="relative shrink-0 rounded-full shadow-xs flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="overflow-visible"
        >
          {/* Dial Background */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            className="fill-white/10 dark:fill-black/40 stroke-white/40"
            strokeWidth="1.5"
          />

          {/* 12-Hour Tick Marks */}
          {[...Array(12)].map((_, i) => {
            const angle = (i * 30 * Math.PI) / 180;
            const isCardinal = i % 3 === 0;
            const tickLength = isCardinal ? 3.5 : 2;
            const rInner = radius - tickLength - 1;
            const rOuter = radius - 1;

            const x1 = center + rInner * Math.sin(angle);
            const y1 = center - rInner * Math.cos(angle);
            const x2 = center + rOuter * Math.sin(angle);
            const y2 = center - rOuter * Math.cos(angle);

            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="white"
                strokeWidth={isCardinal ? 1.5 : 1}
                strokeOpacity={isCardinal ? 0.95 : 0.6}
                strokeLinecap="round"
              />
            );
          })}

          {/* Hour Hand */}
          <line
            x1={center}
            y1={center}
            x2={center + (radius * 0.52) * Math.sin((hourAngle * Math.PI) / 180)}
            y2={center - (radius * 0.52) * Math.cos((hourAngle * Math.PI) / 180)}
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Minute Hand */}
          <line
            x1={center}
            y1={center}
            x2={center + (radius * 0.76) * Math.sin((minuteAngle * Math.PI) / 180)}
            y2={center - (radius * 0.76) * Math.cos((minuteAngle * Math.PI) / 180)}
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
          />

          {/* Second Hand (Accent) */}
          <line
            x1={center - (radius * 0.2) * Math.sin((secondAngle * Math.PI) / 180)}
            y1={center + (radius * 0.2) * Math.cos((secondAngle * Math.PI) / 180)}
            x2={center + (radius * 0.85) * Math.sin((secondAngle * Math.PI) / 180)}
            y2={center - (radius * 0.85) * Math.cos((secondAngle * Math.PI) / 180)}
            stroke="#6EE7B7"
            strokeWidth="1"
            strokeLinecap="round"
          />

          {/* Center Pin / Pivot */}
          <circle cx={center} cy={center} r="1.8" className="fill-white stroke-[#1D4137]" strokeWidth="0.5" />
        </svg>
      </div>

      {/* Digital Text Next to Clock */}
      {showDigitalText && (
        <div className="flex items-center font-mono font-bold text-xs sm:text-sm text-white tracking-wider">
          <span>{String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}</span>
          <span className="hidden sm:inline">:{String(seconds).padStart(2, '0')}</span>
          {showTimezone && (
            <span className="text-[9px] sm:text-[10px] text-white/80 font-sans font-semibold ml-1 hidden sm:inline">WITA</span>
          )}
        </div>
      )}
    </div>
  );
};
