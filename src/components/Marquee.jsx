// Infinite horizontal ticker. Content is rendered twice so the loop is seamless.
export default function Marquee({ children, speed = 30, reverse = false, pauseOnHover = true, className = '' }) {
  return (
    <div className={`marquee ${pauseOnHover ? 'pausable' : ''} ${className}`} style={{ '--speed': `${speed}s` }}>
      <div className={`marquee-track ${reverse ? 'reverse' : ''}`}>
        <div className="marquee-group">{children}</div>
        <div className="marquee-group" aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}
