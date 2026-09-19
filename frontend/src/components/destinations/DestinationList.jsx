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
    <div className="destination-list flex flex-col gap-3">
      {destinations.map(dest => (
        <div key={dest.id} className="destination-card card border-border p-4 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start gap-2">
            <div className="destination-card__info flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="badge bg-primary-light text-primary text-xs font-bold">
                  📍 Destination
                </span>
                {dest.currency && (
                  <span className="badge bg-surface-secondary text-main text-xs border border-border font-semibold">
                    💱 {dest.currency}
                  </span>
                )}
              </div>
              <h4 className="destination-card__name font-bold text-base text-main">{dest.name}</h4>
              {dest.address && (
                <p className="destination-card__address text-xs text-muted mt-1 leading-relaxed">
                  <span className="font-semibold text-main">Address:</span> {dest.address}
                </p>
              )}
              {dest.latitude && dest.longitude && (
                <p className="text-[11px] text-muted mt-1 font-mono">
                  <span className="font-sans font-semibold text-main">Coordinates:</span> {Number(dest.latitude).toFixed(4)}°, {Number(dest.longitude).toFixed(4)}°
                </p>
              )}
              {dest.description && (
                <p className="destination-card__desc text-xs text-muted mt-1.5 italic bg-surface-secondary p-2 rounded border border-border">
                  {dest.description}
                </p>
              )}
            </div>
            <div className="destination-card__actions flex items-center gap-1">
              <button 
                type="button"
                className="btn btn-ghost btn-sm" 
                onClick={() => onEdit(dest)}
                aria-label={`Edit ${dest.name}`}
              >
                ✏️ Edit
              </button>
              <button 
                type="button"
                className="btn btn-ghost btn-sm text-error" 
                onClick={() => onDelete(dest.id)}
                aria-label={`Delete ${dest.name}`}
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
