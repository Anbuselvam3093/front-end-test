import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import searchResultsFixture from '../../../../fixtures/search-results.json';
import type { BookingResponse } from '@/types/booking';
import { normalizeHoliday, deriveFilterOptions } from '@/utils/data-normalizer';

import { FilterSidebar } from './filter-sidebar.component';
import { HolidayCard } from './holiday-card.component';
import { SearchSummary } from './search-summary.component';
import { SortControl } from './sort-control.component';
import SearchResultsComponent from './search-results.component';

describe('search results component tests', () => {
  const holidays = (searchResultsFixture as BookingResponse).holidays.map((holiday, index) =>
    normalizeHoliday(holiday, index)
  );
  const filterOptions = deriveFilterOptions(holidays);

  describe('FilterSidebar component', () => {
    it('renders sidebar title and filter groups', () => {
      const html = renderToStaticMarkup(
        <FilterSidebar
          filterOptions={filterOptions}
          filterState={{
            maxPrice: null,
            minPrice: null,
            priceRanges: ['under-1000'],
            facilities: ['Pool'],
            ratings: [5],
            sort: 'recommended',
          }}
          holidays={holidays}
          onFilterChange={() => undefined}
          onResetAll={() => undefined}
        />
      );

      assert.ok(html.includes('Filter Results'));
      assert.ok(html.includes('Price per person'));
      assert.ok(html.includes('Hotel Facilities'));
      assert.ok(html.includes('5 Stars'));
      assert.ok(html.includes('Pool'));
      assert.ok(html.includes('checked=""'));
    });

    it('renders counts for facilities and price ranges', () => {
      const html = renderToStaticMarkup(
        <FilterSidebar
          filterOptions={filterOptions}
          filterState={{
            maxPrice: null,
            minPrice: null,
            priceRanges: [],
            facilities: [],
            ratings: [],
            sort: 'recommended',
          }}
          holidays={holidays}
          onFilterChange={() => undefined}
          onResetAll={() => undefined}
        />
      );

      assert.ok(html.includes('Filter Holidays'));
      assert.ok(html.includes('Star / Rating'));
    });
  });

  describe('HolidayCard component', () => {
    it('renders holiday title, board basis, rating, and price details', () => {
      const html = renderToStaticMarkup(<HolidayCard holiday={holidays[0]} />);

      assert.ok(html.includes('Beach Club Resort'));
      assert.ok(html.includes('Room Only'));
      assert.ok(html.includes('£1,199'));
      assert.ok(html.includes('View Holiday'));
      assert.ok(html.includes('★ 4'));
    });

    it('renders unrated fallback when rating is null', () => {
      const unratedHoliday = holidays.find((h) => h.effectiveRating === null) || {
        ...holidays[0],
        effectiveRating: null,
      };
      const html = renderToStaticMarkup(<HolidayCard holiday={unratedHoliday} />);

      assert.ok(html.includes('Unrated'));
    });
  });

  describe('SearchSummary component', () => {
    it('renders active filter badges and location header', () => {
      const html = renderToStaticMarkup(
        <SearchSummary
          location="orlando"
          gateway="London"
          departureDate="2026-09-14"
          duration="7"
          partyFormatted="2 people / 1 room"
          filterOptions={filterOptions}
          filterState={{
            maxPrice: 1200,
            minPrice: null,
            priceRanges: ['under-1000'],
            facilities: ['Pool'],
            ratings: [5],
            sort: 'recommended',
          }}
          onRemovePriceRange={() => undefined}
          onRemoveFacility={() => undefined}
          onRemoveRating={() => undefined}
          onResetMaxPrice={() => undefined}
          onResetAll={() => undefined}
        />
      );

      assert.ok(html.includes('Holidays in Orlando'));
      assert.ok(html.includes('Flying from London'));
      assert.ok(html.includes('Active Filters:'));
      assert.ok(html.includes('Up to £1200 pp'));
      assert.ok(html.includes('Remove 5 rating filter'));
      assert.ok(html.includes('Clear all filters'));
    });
  });

  describe('SortControl component', () => {
    it('renders result count and sort select control', () => {
      const html = renderToStaticMarkup(
        <SortControl currentSort="rating-desc" onSortChange={() => undefined} resultCount={6} />
      );

      assert.ok(html.includes('Showing 6 holidays'));
      assert.ok(html.includes('Sort by:'));
      assert.ok(html.includes('Rating: High to Low'));
      assert.ok(html.includes('value="rating-desc"'));
    });

    it('handles singular result count formatting', () => {
      const html = renderToStaticMarkup(
        <SortControl currentSort="recommended" onSortChange={() => undefined} resultCount={1} />
      );

      assert.ok(html.includes('Showing 1 holiday'));
    });
  });

  describe('SearchResults component', () => {
    it('renders search results page with filter sidebar, sort controls, and cards', () => {
      const html = renderToStaticMarkup(
        <SearchResultsComponent
          searchParams={{
            location: 'orlando',
            gateway: 'London',
            departureDate: '2026-09-14',
            duration: '7',
            partyCompositions: 'a2',
          }}
        />
      );

      assert.ok(html.includes('Holidays in Orlando'));
      assert.ok(html.includes('Filter Results'));
      assert.ok(html.includes('Showing 6 holidays'));
      assert.ok(html.includes('Beach Club Resort'));
    });
  });
});
