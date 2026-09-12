'use client';

import React from 'react';
import type { FilterState } from '@/utils/data-normalizer';
import styles from './search-results.module.css';

interface SearchSummaryProps {
  location?: string;
  gateway?: string;
  departureDate?: string;
  duration?: string;
  partyFormatted?: string;
  filterState: FilterState;
  onRemoveFacility: (facility: string) => void;
  onRemoveRating: (rating: number | 'Unrated') => void;
  onResetMaxPrice: () => void;
  onResetAll: () => void;
}

export const SearchSummary: React.FC<SearchSummaryProps> = ({
  location,
  gateway,
  departureDate,
  duration = '7',
  partyFormatted = '2 people / 1 room',
  filterState,
  onRemoveFacility,
  onRemoveRating,
  onResetMaxPrice,
  onResetAll,
}) => {
  const hasActiveFilters =
    filterState.maxPrice !== null ||
    filterState.facilities.length > 0 ||
    filterState.ratings.length > 0;

  const displayLocation = location
    ? location.charAt(0).toUpperCase() + location.slice(1).replace('-', ' ')
    : 'All Destinations';

  return (
    <div className={styles.summaryHeader}>
      <div className={styles.summaryTop}>
        <div>
          <h2 className={styles.title}>Holidays in {displayLocation}</h2>
          <p className={styles.subtitle}>
            {gateway ? `Flying from ${gateway}` : ''}
            {departureDate ? ` • Departing ${departureDate}` : ''}
            {` • ${duration} nights • ${partyFormatted}`}
          </p>
        </div>
      </div>

      {hasActiveFilters && (
        <div className={styles.activeFiltersBar}>
          <span className={styles.activeFiltersLabel}>Active Filters:</span>

          {filterState.maxPrice !== null && (
            <span className={styles.filterBadge}>
              Up to £{filterState.maxPrice} pp
              <button
                type="button"
                className={styles.filterBadgeRemove}
                onClick={onResetMaxPrice}
                aria-label="Remove max price filter"
              >
                ✕
              </button>
            </span>
          )}

          {filterState.ratings.map((rating) => (
            <span key={`rating-${rating}`} className={styles.filterBadge}>
              {rating === 'Unrated' ? 'Unrated' : `${rating} ★`}
              <button
                type="button"
                className={styles.filterBadgeRemove}
                onClick={() => onRemoveRating(rating)}
                aria-label={`Remove ${rating} rating filter`}
              >
                ✕
              </button>
            </span>
          ))}

          {filterState.facilities.map((fac) => (
            <span key={`fac-${fac}`} className={styles.filterBadge}>
              {fac}
              <button
                type="button"
                className={styles.filterBadgeRemove}
                onClick={() => onRemoveFacility(fac)}
                aria-label={`Remove ${fac} facility filter`}
              >
                ✕
              </button>
            </span>
          ))}

          <button
            type="button"
            className={styles.clearButton}
            onClick={onResetAll}
            style={{ marginLeft: 'auto' }}
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
};
