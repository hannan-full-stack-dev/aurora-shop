import { RefreshCw } from 'lucide-react';

export default function ErrorState({ message, onRetry }) {
  return (
    <div className="state-box" role="alert">
      <h2>We couldn’t load the products</h2>
      <p>{message || 'Please check your connection and try again.'}</p>
      {onRetry && (
        <button className="btn btn-primary" onClick={() => onRetry()}>
          <RefreshCw size={16} /> Try again
        </button>
      )}
    </div>
  );
}
