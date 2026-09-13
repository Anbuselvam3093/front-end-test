import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SearchSummary } from './search-summary.component';
import type { FilterOptions, FilterState } from '@/utils/data-normalizer';

const filterOptions: FilterOptions = {
  minPrice: 100,
  maxPrice: 3000,
  availablePriceRanges: [
    { id: 'under-1000', label: 'Under £1,000', min: 0, max: 999.99 },
    { id: '1000-1500', label: '£1,000 - £1,500', min: 1000, max: 1499.99 },
  ],
  availableFacilities: ['Pool', 'Free WiFi'],
  availableRatings: [5, 4, 'Unrated'],
};

const baseFilterState: FilterState = {
  maxPrice: null,
  minPrice: null,
  priceRanges: [],
  facilities: [],
  ratings: [],
  sort: 'recommended',
};

function renderSummary(overrides?: Partial<FilterState>) {
  const filterState = {
    ...baseFilterState,
    ...(overrides ?? {}),
  } as FilterState;

  return renderToStaticMarkup(
    <SearchSummary
      location="new-york"
      gateway="London"
      departureDate="2026-09-15"
      duration="10"
      partyFormatted="2 adults / 1 room"
      filterOptions={filterOptions}
      filterState={filterState}
      onRemovePriceRange={() => undefined}
      onRemoveFacility={() => undefined}
      onRemoveRating={() => undefined}
      onResetMaxPrice={() => undefined}
      onResetAll={() => undefined}
    />
  );
}

describe('SearchSummary', () => {
  it('renders formatted heading and trip summary details', () => {
    const html = renderSummary();

    assert.ok(html.includes('Holidays in New york'));
    assert.ok(html.includes('Flying from London'));
    assert.ok(html.includes('Departing 2026-09-15'));
    assert.ok(html.includes('10 nights • 2 adults / 1 room'));
  });

  it('hides active filters section when no active filters are set', () => {
    const html = renderSummary();

    assert.equal(html.includes('Active Filters:'), false);
    assert.equal(html.includes('Clear all filters'), false);
  });

  it('shows all active filter badges when filters are active', () => {
    const html = renderSummary({
      maxPrice: 1200,
      priceRanges: ['under-1000'],
      facilities: ['Pool'],
      ratings: [5],
    });

    assert.ok(html.includes('Active Filters:'));
    assert.ok(html.includes('Under £1,000 pp'));
    assert.ok(html.includes('Up to £1200 pp'));
    assert.ok(html.includes('5 ★'));
    assert.ok(html.includes('Pool'));
    assert.ok(html.includes('Clear all filters'));
  });

  it('falls back to range id label when range option is not found', () => {
    const html = renderSummary({
      priceRanges: ['custom-range-id'],
    });

    assert.ok(html.includes('custom-range-id pp'));
  });

  it('does not crash when filter arrays are missing', () => {
    const unsafeFilterState = {
      maxPrice: null,
      minPrice: null,
      sort: 'recommended',
      priceRanges: undefined,
      facilities: undefined,
      ratings: undefined,
    } as unknown as FilterState;

    const html = renderToStaticMarkup(
      <SearchSummary
        filterOptions={filterOptions}
        filterState={unsafeFilterState}
        onRemovePriceRange={() => undefined}
        onRemoveFacility={() => undefined}
        onRemoveRating={() => undefined}
        onResetMaxPrice={() => undefined}
        onResetAll={() => undefined}
      />
    );

    assert.ok(html.includes('Holidays in All Destinations'));
    assert.equal(html.includes('Active Filters:'), false);
  });
});
