import { Check } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export default function Toast() {
  const { toast } = useStore();
  return (
    <div className="toast-wrap" role="status" aria-live="polite">
      {toast && (
        <div className="toast" key={toast.id}>
          <Check size={16} /> {toast.message}
        </div>
      )}
    </div>
  );
}
