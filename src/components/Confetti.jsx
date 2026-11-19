import { useMemo } from 'react';

const COLORS = ['#d6ff3d', '#ff5b37', '#7a5cff', '#7ad7ff', '#ffb3d1', '#111110'];

// Celebration burst for the order-confirmation screen (pure CSS animation).
export default function Confetti({ count = 70 }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        dur: 2.2 + Math.random() * 1.8,
        size: 7 + Math.random() * 8,
        color: COLORS[i % COLORS.length],
        rot: Math.random() * 360,
        drift: (Math.random() - 0.5) * 180,
      })),
    [count]
  );

  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((p, i) => (
        <i
          key={i}
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.45,
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.dur}s`,
            '--rot': `${p.rot}deg`,
            '--drift': `${p.drift}px`,
          }}
        />
      ))}
    </div>
  );
}
