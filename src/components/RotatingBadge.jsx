import { useId } from 'react';

// Circular text sticker that slowly spins.
export default function RotatingBadge({ text = 'NEW DROPS EVERY WEEK ✦ FREE SHIPPING OVER $100 ✦ ', center = '✦', size = 120, className = '' }) {
  const id = `ring-${useId().replace(/:/g, '')}`;
  return (
    <div className={`badge-spin ${className}`} style={{ width: size, height: size }} aria-hidden="true">
      <svg viewBox="0 0 100 100" className="badge-ring">
        <defs>
          <path id={id} d="M50,50 m-37,0 a37,37 0 1,1 74,0 a37,37 0 1,1 -74,0" />
        </defs>
        <text>
          <textPath href={`#${id}`} textLength="230" lengthAdjust="spacing">
            {text}
          </textPath>
        </text>
      </svg>
      <span className="badge-center">{center}</span>
    </div>
  );
}
