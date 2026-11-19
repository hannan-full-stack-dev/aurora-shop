import { useEffect, useState } from 'react';

// Live countdown to local midnight ("deal of the day"). Digits flip when they change.
function parts() {
  const now = new Date();
  const end = new Date(now);
  end.setHours(24, 0, 0, 0);
  const s = Math.max(0, Math.floor((end - now) / 1000));
  return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60];
}

export default function Countdown() {
  const [t, setT] = useState(parts);

  useEffect(() => {
    const id = setInterval(() => setT(parts()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="countdown" role="timer" aria-label="Time left in today's deals">
      {['hrs', 'min', 'sec'].map((label, i) => (
        <div className="cd-box" key={label}>
          <span className="cd-num" key={t[i]}>
            {String(t[i]).padStart(2, '0')}
          </span>
          <small>{label}</small>
        </div>
      ))}
    </div>
  );
}
