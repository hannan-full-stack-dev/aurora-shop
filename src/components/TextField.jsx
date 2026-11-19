import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

// Floating-label input used by the login / register / account forms.
export default function TextField({ id, label, error, type = 'text', ...rest }) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className={`field floating ${error ? 'invalid' : ''}`}>
      <input
        id={id}
        type={isPassword && show ? 'text' : type}
        placeholder=" "
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-err` : undefined}
        {...rest}
      />
      <label htmlFor={id}>{label}</label>
      {isPassword && (
        <button
          type="button"
          className="pw-toggle"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      )}
      {error && (
        <span className="field-error" id={`${id}-err`}>
          {error}
        </span>
      )}
    </div>
  );
}
