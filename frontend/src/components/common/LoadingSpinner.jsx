import './LoadingSpinner.css';

/**
 * Reusable loading spinner component.
 * @param {string} message - Optional loading message
 * @param {string} size - 'sm' | 'md' | 'lg' (default 'md')
 */
export default function LoadingSpinner({ message = 'Loading...', size = 'md' }) {
  return (
    <div className={`loading-spinner loading-spinner--${size}`} role="status">
      <div className="loading-spinner__circle" />
      {message && <p className="loading-spinner__text">{message}</p>}
    </div>
  );
}
