import { CheckCircle2 } from 'lucide-react';
import RotatingBadge from './RotatingBadge';

// Two-panel layout shared by the login and register pages.
export default function AuthShell({ title, subtitle, art, footer, children }) {
  return (
    <div className="auth">
      <aside className="auth-art" aria-hidden="true">
        <span className="orb orb-1" />
        <span className="orb orb-2" />
        <span className="orb orb-3" />
        <RotatingBadge className="auth-badge" size={110} center="✦" />
        <div className="auth-art-copy">
          <h2>{art.title}</h2>
          <p>{art.text}</p>
          <ul>
            {art.points.map((p) => (
              <li key={p}>
                <CheckCircle2 size={18} /> {p}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <section className="auth-panel">
        <div className="auth-card">
          <h1>{title}</h1>
          <p className="muted auth-sub">{subtitle}</p>
          {children}
          <p className="auth-foot">{footer}</p>
          <p className="demo-note">
            Demo authentication: accounts are stored only in this browser (no server), so never reuse a real password.
          </p>
        </div>
      </section>
    </div>
  );
}
