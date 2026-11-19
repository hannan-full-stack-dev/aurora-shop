import { useEffect, useState } from 'react';
import useInView from '../hooks/useInView';

// Counts from 0 to `to` the first time it scrolls into view.
export default function CountUp({ to = 0, duration = 1400, decimals = 0, suffix = '' }) {
  const [ref, inView] = useInView({ threshold: 0.4 });
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!inView) return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setVal(to);
      return undefined;
    }
    let raf;
    const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / duration);
      setVal(to * (1 - (1 - p) ** 3));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, duration]);

  return (
    <span ref={ref}>
      {decimals ? val.toFixed(decimals) : Math.round(val).toLocaleString()}
      {suffix}
    </span>
  );
}
