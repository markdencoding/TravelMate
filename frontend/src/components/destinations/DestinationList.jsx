import React from 'react';
import EmptyState from '../common/EmptyState';

export default function DestinationList({ destinations, onEdit, onDelete }) {
  if (!destinations || destinations.length === 0) {
    return (
      <EmptyState
        icon="📍"
        title="No destinations yet"
        description="Search and add places you want to visit on this trip."
      />
    );
  }

  return (
    <div className="destination-list">
      {destinations.map(dest => (
        <div key={dest.id} className="destination-card">
          <div className="destination-card__info">
            <h4 className="destination-card__name">{dest.name}</h4>
            {dest.address && <p className="destination-card__address">{dest.address}</p>}
            {dest.description && <p className="destination-card__desc">{dest.description}</p>}
          </div>
          <div className="destination-card__actions">
            <button className="btn btn-ghost btn-sm" onClick={() => onEdit(dest)}>✏️ Edit</button>
            <button className="btn btn-ghost btn-sm text-error" onClick={() => onDelete(dest.id)}>🗑️ Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}
