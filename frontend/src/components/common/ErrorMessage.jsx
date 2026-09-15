import './ErrorMessage.css';

/**
 * Reusable error message component.
 * Per DESIGN.md §22.4: explains what happened + what user can do.
 *
 * @param {string} message - Error message text
 * @param {function} onRetry - Optional retry callback
 */
export default function ErrorMessage({
  message = 'Something went wrong. Please try again.',
  onRetry = null,
}) {
  return (
    <div className="error-message" role="alert">
      <span className="error-message__icon">⚠️</span>
      <p className="error-message__text">{message}</p>
      {onRetry && (
        <button className="btn btn-secondary" onClick={onRetry}>
          Try Again
        </button>
      )}
    </div>
  );
}
