'use client';

import React from 'react';
import type { SortOption } from '@/utils/data-normalizer';
import styles from './search-results.module.css';

interface SortControlProps {
  currentSort: SortOption;
  onSortChange: (newSort: SortOption) => void;
  resultCount: number;
}

export const SortControl: React.FC<SortControlProps> = ({
  currentSort,
  onSortChange,
  resultCount,
}) => {
  return (
    <div className={styles.topControls}>
      <span className={styles.resultsCountText}>
        Showing {resultCount} {resultCount === 1 ? 'holiday' : 'holidays'}
      </span>

      <div className={styles.sortContainer}>
        <label htmlFor="sort-select" className={styles.sortLabel}>
          Sort by:
        </label>
        <select
          id="sort-select"
          className={styles.sortSelect}
          value={currentSort}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
        >
          <option value="recommended">Recommended</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="rating-desc">Rating: High to Low</option>
        </select>
      </div>
    </div>
  );
};
