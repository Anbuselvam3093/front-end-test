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
  const safePriceRanges = filterState?.priceRanges ?? [];
  const safeFacilities = filterState?.facilities ?? [];
  const safeRatings = filterState?.ratings ?? [];

  const currentMaxPrice = filterState.maxPrice ?? filterOptions.maxPrice;

  // Calculate counts for each price range across holidays in current search
  const priceRangeCounts = React.useMemo(() => {
    const counts = new Map<string, number>();
    for (const range of filterOptions.availablePriceRanges) {
      const count = holidays.filter((h) => {
        if (range.id.startsWith('under-')) {
          const maxVal = parseFloat(range.id.replace('under-', ''));
          return h.pricePerPerson < maxVal;
        }
        if (range.id.startsWith('over-')) {
          const minVal = parseFloat(range.id.replace('over-', ''));
          return h.pricePerPerson >= minVal;
        }
        const [minStr, maxStr] = range.id.split('-');
        const minVal = parseFloat(minStr);
        const maxVal = parseFloat(maxStr);
        if (!isNaN(minVal) && !isNaN(maxVal)) {
          return h.pricePerPerson >= minVal && h.pricePerPerson <= maxVal;
        }
        return h.pricePerPerson >= range.min && h.pricePerPerson <= range.max;
      }).length;
      counts.set(range.id, count);
    }
    return counts;
  }, [filterOptions.availablePriceRanges, holidays]);

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

  const handlePriceRangeToggle = (rangeId: string) => {
    const exists = safePriceRanges.includes(rangeId);
    const updated = exists
      ? safePriceRanges.filter((id) => id !== rangeId)
      : [...safePriceRanges, rangeId];
    onFilterChange({ priceRanges: updated });
  };

  const handleFacilityToggle = (facility: string) => {
    const exists = safeFacilities.includes(facility);
    const updated = exists
      ? safeFacilities.filter((f) => f !== facility)
      : [...safeFacilities, facility];
    onFilterChange({ facilities: updated });
  };

  const handleRatingToggle = (rating: number | 'Unrated') => {
    const exists = safeRatings.includes(rating);
    const updated = exists
      ? safeRatings.filter((r) => r !== rating)
      : [...safeRatings, rating];
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
    safePriceRanges.length > 0 ||
    safeFacilities.length > 0 ||
    safeRatings.length > 0;

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

        {/* Dynamic Price per Person Checkbox Filter (Low to High) */}
        <fieldset className={styles.filterGroup}>
          <legend className={styles.filterLegend}>Price per person</legend>
          {filterOptions.availablePriceRanges.length > 0 && (
            <div className={styles.checkboxList}>
              {filterOptions.availablePriceRanges.map((range) => {
                const isChecked = safePriceRanges.includes(range.id);
                const count = priceRangeCounts.get(range.id) || 0;

                return (
                  <label key={`price-range-${range.id}`} className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handlePriceRangeToggle(range.id)}
                      className={styles.checkboxInput}
                    />
                    <span>{range.label}</span>
                    <span className={styles.countBadge}>({count})</span>
                  </label>
                );
              })}
            </div>
          )}

          {/* <div className={styles.priceControl} style={{ marginTop: '0.8rem' }}>
            <div className={styles.priceDisplay}>
              Max: £{currentMaxPrice.toLocaleString()} pp
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
          </div> */}
        </fieldset>

        {/* Rating Filter */}
        {filterOptions.availableRatings.length > 0 && (
          <fieldset className={styles.filterGroup}>
            <legend className={styles.filterLegend}>Star / Rating</legend>
            <div className={styles.checkboxList}>
              {filterOptions.availableRatings.map((rating) => {
                const isChecked = safeRatings.includes(rating);
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
                const isChecked = safeFacilities.includes(fac);
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
