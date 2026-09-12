'use client';

import React from 'react';
import Image from 'next/image';
import type { NormalizedHoliday } from '@/utils/data-normalizer';
import styles from './search-results.module.css';

interface HolidayCardProps {
  holiday: NormalizedHoliday;
  durationNights?: string;
  partyFormatted?: string;
}

export const HolidayCard: React.FC<HolidayCardProps> = ({
  holiday,
  durationNights = '7',
  partyFormatted = '2 people / 1 room',
}) => {
  const [hasImageError, setHasImageError] = React.useState(false);

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const renderRatingStars = (rating: number | null) => {
    if (rating === null) return 'Unrated';
    return `★ ${rating}`;
  };

  // Combine atAGlance and top facilities for highlights
  const highlights = Array.from(
    new Set([...holiday.atAGlance, ...holiday.facilities])
  ).slice(0, 4);

  return (
    <article className={styles.card} data-testid="holiday-card">
      <div className={styles.cardImageWrapper}>
        {holiday.imageUrl && !hasImageError ? (
          <Image
            src={holiday.imageUrl}
            alt={holiday.hotelName}
            fill
            sizes="(max-width: 680px) 100vw, 280px"
            className={styles.cardImage}
            unoptimized
            onError={() => setHasImageError(true)}
          />
        ) : (
          <div className={styles.placeholderImage}>
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16" />
              <path d="M12 7v4" />
              <path d="M12 15h.01" />
              <path d="M16 11v4" />
              <path d="M8 11v4" />
            </svg>
            <span>Photo unavailable</span>
            <small className={styles.placeholderSubtext}>Image couldn&apos;t be loaded.</small>
          </div>
        )}
      </div>

      <div className={styles.cardBody}>
        <div className={styles.cardMainInfo}>
          <div className={styles.cardHeaderRow}>
            <span className={styles.boardBasisBadge}>{holiday.boardBasis}</span>
            <span
              className={styles.ratingBadge}
              aria-label={`Rating: ${renderRatingStars(holiday.effectiveRating)}`}
            >
              {renderRatingStars(holiday.effectiveRating)}
            </span>
          </div>

          <h3 className={styles.hotelName} title={holiday.hotelName}>
            {holiday.hotelName}
          </h3>

          <p className={styles.hotelLocation}>
            📍 {[...holiday.hotelLocation, holiday.parentLocation].filter(Boolean).join(', ')}
          </p>

          {holiday.description && (
            <p className={styles.description}>{holiday.description}</p>
          )}

          {highlights.length > 0 && (
            <div className={styles.highlightsList}>
              {highlights.map((item, idx) => (
                <span key={idx} className={styles.highlightChip}>
                  {item}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className={styles.cardFooter}>
          <div className={styles.priceGroup}>
            <span className={styles.pricePerPerson}>
              {formatPrice(holiday.pricePerPerson)}
              <small style={{ fontSize: '1.2rem', fontWeight: 'normal' }}> pp</small>
            </span>
            <span className={styles.totalPrice}>
              {formatPrice(holiday.totalPrice)} total ({durationNights} nights, {partyFormatted})
            </span>
            {holiday.virginPoints > 0 && (
              <span className={styles.pointsCallout}>
                Earn {holiday.virginPoints.toLocaleString()} Virgin Points
              </span>
            )}
          </div>

          <button
            type="button"
            className={styles.selectButton}
            onClick={() => alert(`Selected ${holiday.hotelName}`)}
            aria-label={`View details for ${holiday.hotelName}`}
          >
            View Holiday
          </button>
        </div>
      </div>
    </article>
  );
};
