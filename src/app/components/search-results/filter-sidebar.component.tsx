'use client';

import React, { useState } from 'react';
import type { FilterOptions, FilterState, NormalizedHoliday } from '@/utils/data-normalizer';
import styles from './search-results.module.css';

interface FilterSidebarProps {
  filterOptions: FilterOptions;
  filterState: FilterState;
  holidays: NormalizedHoliday[];
  onFilterChange: (newState: Partial<FilterState>) => void;
  onResetAll: () => void;
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  filterOptions,
  filterState,
  holidays,
  onFilterChange,
  onResetAll,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const currentMaxPrice = filterState.maxPrice ?? filterOptions.maxPrice;

  // Calculate counts for each facility across all holidays in current search
  const facilityCounts = React.useMemo(() => {
    const counts = new Map<string, number>();
    for (const h of holidays) {
      for (const f of h.facilities) {
        counts.set(f, (counts.get(f) || 0) + 1);
      }
    }
    return counts;
  }, [holidays]);

  // Calculate counts for each rating
  const ratingCounts = React.useMemo(() => {
    const counts = new Map<number | 'Unrated', number>();
    for (const h of holidays) {
      const key = h.effectiveRating !== null ? h.effectiveRating : 'Unrated';
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    return counts;
  }, [holidays]);

  const handleFacilityToggle = (facility: string) => {
    const exists = filterState.facilities.includes(facility);
    const updated = exists
      ? filterState.facilities.filter((f) => f !== facility)
      : [...filterState.facilities, facility];
    onFilterChange({ facilities: updated });
  };

  const handleRatingToggle = (rating: number | 'Unrated') => {
    const exists = filterState.ratings.includes(rating);
    const updated = exists
      ? filterState.ratings.filter((r) => r !== rating)
      : [...filterState.ratings, rating];
    onFilterChange({ ratings: updated });
  };

  const handleMaxPriceChange = (value: number) => {
    if (value >= filterOptions.maxPrice) {
      onFilterChange({ maxPrice: null });
    } else {
      onFilterChange({ maxPrice: value });
    }
  };

  const hasActiveFilters =
    filterState.maxPrice !== null ||
    filterState.facilities.length > 0 ||
    filterState.ratings.length > 0;

  return (
    <>
      <button
        type="button"
        className={styles.mobileToggle}
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-expanded={mobileOpen}
      >
        <span>{mobileOpen ? 'Hide Filters' : 'Filter Holidays'}</span>
        {hasActiveFilters && <span>(Active)</span>}
      </button>

      <aside
        className={styles.sidebar}
        style={{ display: mobileOpen ? 'flex' : undefined }}
      >
        <div className={styles.filterHeader}>
          <h3 className={styles.sidebarTitle}>Filter Results</h3>
          {hasActiveFilters && (
            <button
              type="button"
              className={styles.clearButton}
              onClick={onResetAll}
            >
              Reset All
            </button>
          )}
        </div>

        {/* Price Filter */}
        <fieldset className={styles.filterGroup}>
          <legend className={styles.filterLegend}>Price per person</legend>
          <div className={styles.priceControl}>
            <div className={styles.priceDisplay}>
              Up to £{currentMaxPrice.toLocaleString()} pp
            </div>
            <input
              type="range"
              min={filterOptions.minPrice}
              max={filterOptions.maxPrice}
              step={50}
              value={currentMaxPrice}
              onChange={(e) => handleMaxPriceChange(Number(e.target.value))}
              className={styles.rangeInput}
              aria-label="Maximum price per person"
            />
            <div className={styles.presetButtons}>
              <button
                type="button"
                className={`${styles.presetBtn} ${filterState.maxPrice === 1000 ? styles.presetBtnActive : ''}`}
                onClick={() => handleMaxPriceChange(1000)}
              >
                Under £1k
              </button>
              <button
                type="button"
                className={`${styles.presetBtn} ${filterState.maxPrice === 1500 ? styles.presetBtnActive : ''}`}
                onClick={() => handleMaxPriceChange(1500)}
              >
                Under £1.5k
              </button>
              <button
                type="button"
                className={`${styles.presetBtn} ${filterState.maxPrice === 2000 ? styles.presetBtnActive : ''}`}
                onClick={() => handleMaxPriceChange(2000)}
              >
                Under £2k
              </button>
              <button
                type="button"
                className={`${styles.presetBtn} ${filterState.maxPrice === null ? styles.presetBtnActive : ''}`}
                onClick={() => onFilterChange({ maxPrice: null })}
              >
                Any
              </button>
            </div>
          </div>
        </fieldset>

        {/* Rating Filter */}
        {filterOptions.availableRatings.length > 0 && (
          <fieldset className={styles.filterGroup}>
            <legend className={styles.filterLegend}>Star / Rating</legend>
            <div className={styles.checkboxList}>
              {filterOptions.availableRatings.map((rating) => {
                const isChecked = filterState.ratings.includes(rating);
                const count = ratingCounts.get(rating) || 0;
                const label = rating === 'Unrated' ? 'Unrated' : `${rating} Stars`;

                return (
                  <label key={`rating-check-${rating}`} className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleRatingToggle(rating)}
                      className={styles.checkboxInput}
                    />
                    <span>{label}</span>
                    <span className={styles.countBadge}>({count})</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        )}

        {/* Facility Filter */}
        {filterOptions.availableFacilities.length > 0 && (
          <fieldset className={styles.filterGroup}>
            <legend className={styles.filterLegend}>Hotel Facilities</legend>
            <div className={styles.checkboxList}>
              {filterOptions.availableFacilities.map((fac) => {
                const isChecked = filterState.facilities.includes(fac);
                const count = facilityCounts.get(fac) || 0;

                return (
                  <label key={`fac-check-${fac}`} className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleFacilityToggle(fac)}
                      className={styles.checkboxInput}
                    />
                    <span>{fac}</span>
                    <span className={styles.countBadge}>({count})</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        )}
      </aside>
    </>
  );
};
