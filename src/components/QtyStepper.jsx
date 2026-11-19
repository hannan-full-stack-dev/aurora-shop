import { Minus, Plus } from 'lucide-react';

export default function QtyStepper({ value, onChange, max = 99 }) {
  return (
    <div className="qty" role="group" aria-label="Quantity">
      <button type="button" onClick={() => onChange(value - 1)} disabled={value <= 1} aria-label="Decrease quantity">
        <Minus size={16} />
      </button>
      <span aria-live="polite">{value}</span>
      <button type="button" onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="Increase quantity">
        <Plus size={16} />
      </button>
    </div>
  );
}
