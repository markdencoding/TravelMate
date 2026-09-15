import './EmptyState.css';

/**
 * Reusable empty state component.
 * Used when a list or section has no data.
 * Per DESIGN.md §22.3: descriptive message + call to action.
 *
 * @param {string} icon - Emoji or icon character
 * @param {string} title - Main message
 * @param {string} description - Supporting text
 * @param {React.ReactNode} action - Optional action button/link
 */
export default function EmptyState({
  icon = '📭',
  title = 'Nothing here yet',
  description = '',
  action = null,
}) {
  return (
    <div className="empty-state">
      <span className="empty-state__icon">{icon}</span>
      <h3 className="empty-state__title">{title}</h3>
      {description && <p className="empty-state__description">{description}</p>}
      {action && <div className="empty-state__action">{action}</div>}
    </div>
  );
}
