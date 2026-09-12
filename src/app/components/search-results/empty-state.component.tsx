'use client';

import React from 'react';
import styles from './search-results.module.css';

interface EmptyStateProps {
  onReset: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onReset }) => {
  return (
    <div className={styles.emptyState} data-testid="empty-state">
      <svg
        width="64"
        height="64"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--token-color-colour-brand-purple)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
        <line x1="8" y1="11" x2="14" y2="11" />
      </svg>
      <h3 className={styles.emptyTitle}>No holidays match your search criteria</h3>
      <p className={styles.emptyText}>
        We couldn&apos;t find any holiday packages matching all your selected filters. Try widening your price range, deselecting specific hotel facilities, or clearing filters.
      </p>
      <button
        type="button"
        className={styles.resetButton}
        onClick={onReset}
      >
        Reset All Filters
      </button>
    </div>
  );
};
