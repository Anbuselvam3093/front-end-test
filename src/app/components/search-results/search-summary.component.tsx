'use client';

import React from 'react';
import type { FilterOptions, FilterState } from '@/utils/data-normalizer';
import styles from './search-results.module.css';

interface SearchSummaryProps {
  location?: string;
  gateway?: string;
  departureDate?: string;
  duration?: string;
  partyFormatted?: string;
  filterOptions: FilterOptions;
  filterState: FilterState;
  onRemovePriceRange: (rangeId: string) => void;
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
  filterOptions,
  filterState,
  onRemovePriceRange,
  onRemoveFacility,
  onRemoveRating,
  onResetMaxPrice,
  onResetAll,
}) => {
  const safePriceRanges = filterState?.priceRanges ?? [];
  const safeFacilities = filterState?.facilities ?? [];
  const safeRatings = filterState?.ratings ?? [];

  const hasActiveFilters =
    filterState.maxPrice !== null ||
    safePriceRanges.length > 0 ||
    safeFacilities.length > 0 ||
    safeRatings.length > 0;

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

          {safePriceRanges.map((rangeId) => {
            const rangeObj = filterOptions.availablePriceRanges.find((r) => r.id === rangeId);
            const label = rangeObj ? rangeObj.label : rangeId;

            return (
              <span key={`price-badge-${rangeId}`} className={styles.filterBadge}>
                {label} pp
                <button
                  type="button"
                  className={styles.filterBadgeRemove}
                  onClick={() => onRemovePriceRange(rangeId)}
                  aria-label={`Remove ${label} price filter`}
                >
                  ✕
                </button>
              </span>
            );
          })}

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

          {safeRatings.map((rating) => (
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

          {safeFacilities.map((fac) => (
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
