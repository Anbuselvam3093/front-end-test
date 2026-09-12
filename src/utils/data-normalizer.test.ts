import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseRating,
  normalizeFacility,
  normalizeHoliday,
  deriveFilterOptions,
  filterAndSortHolidays,
  FilterState,
} from './data-normalizer';
import searchResultsFixture from '../../fixtures/search-results.json';
import type { BookingResponse } from '@/types/booking';

describe('data-normalizer', () => {
  describe('parseRating', () => {
    it('parses numeric ratings', () => {
      assert.equal(parseRating(4), 4);
      assert.equal(parseRating(4.5), 4.5);
    });

    it('parses string float and integer ratings', () => {
      assert.equal(parseRating('4.5'), 4.5);
      assert.equal(parseRating('3'), 3);
    });

    it('handles Unrated, empty strings, and null/undefined gracefully', () => {
      assert.equal(parseRating('Unrated'), null);
      assert.equal(parseRating('  unrated '), null);
      assert.equal(parseRating(''), null);
      assert.equal(parseRating(undefined), null);
      assert.equal(parseRating(null), null);
    });
  });

  describe('normalizeFacility', () => {
    it('normalizes wifi variations', () => {
      assert.equal(normalizeFacility('free wifi'), 'Free WiFi');
      assert.equal(normalizeFacility('Free WiFi'), 'Free WiFi');
      assert.equal(normalizeFacility('wifi'), 'Free WiFi');
    });

    it('normalizes kids club variations', () => {
      assert.equal(normalizeFacility('Kids club'), 'Kids Club');
      assert.equal(normalizeFacility("kids' club"), 'Kids Club');
    });

    it('trims and formats standard facilities', () => {
      assert.equal(normalizeFacility('  pool  '), 'Pool');
      assert.equal(normalizeFacility('gym'), 'Gym');
    });
  });

  describe('normalizeHoliday', () => {
    const rawHolidays = (searchResultsFixture as BookingResponse).holidays;

    it('normalizes all fixture holidays without throwing', () => {
      const normalized = rawHolidays.map((h, i) => normalizeHoliday(h, i));
      assert.equal(normalized.length, 6);
    });

    it('deduplicates casing in facilities (e.g. Free WiFi and free wifi)', () => {
      const skyline = normalizeHoliday(rawHolidays[1], 1); // Skyline Grand Hotel
      assert.ok(skyline.facilities.includes('Free WiFi'));
      const wifiCount = skyline.facilities.filter((f) => f.toLowerCase() === 'free wifi').length;
      assert.equal(wifiCount, 1);
    });

    it('handles empty image array and unrated hotel', () => {
      const budgetInn = normalizeHoliday(rawHolidays[3], 3); // Budget Inn Orlando
      assert.equal(budgetInn.imageUrl, null);
      assert.deepEqual(budgetInn.facilities, []);

      const beachClubHalfBoard = normalizeHoliday(rawHolidays[5], 5); // Unrated hotel
      assert.equal(beachClubHalfBoard.effectiveRating, null);
      assert.equal(beachClubHalfBoard.ratingDisplay, 'Unrated');
    });

    it('generates unique keys for duplicate hotel IDs', () => {
      const roomOnly = normalizeHoliday(rawHolidays[0], 0);
      const halfBoard = normalizeHoliday(rawHolidays[5], 5);
      assert.equal(roomOnly.hotelId, 'mco-beach-club-resort');
      assert.equal(halfBoard.hotelId, 'mco-beach-club-resort');
      assert.notEqual(roomOnly.uniqueKey, halfBoard.uniqueKey);
    });
  });

  describe('deriveFilterOptions', () => {
    const holidays = (searchResultsFixture as BookingResponse).holidays.map((h, i) =>
      normalizeHoliday(h, i)
    );

    it('derives correct min and max price, facilities, and ratings from fixture', () => {
      const options = deriveFilterOptions(holidays);
      assert.equal(options.minPrice, 799);
      assert.equal(options.maxPrice, 2560);
      assert.ok(options.availableFacilities.includes('Pool'));
      assert.ok(options.availableFacilities.includes('Free WiFi'));
      assert.deepEqual(options.availableRatings, [5, 4.5, 4, 3, 'Unrated']);
      assert.ok(options.availablePriceRanges.length > 0);
      // Ensure price ranges are sorted from low to high
      for (let i = 0; i < options.availablePriceRanges.length - 1; i++) {
        assert.ok(options.availablePriceRanges[i].min <= options.availablePriceRanges[i + 1].min);
      }
    });
  });

  describe('filterAndSortHolidays', () => {
    const holidays = (searchResultsFixture as BookingResponse).holidays.map((h, i) =>
      normalizeHoliday(h, i)
    );

    const defaultState: FilterState = {
      maxPrice: null,
      minPrice: null,
      priceRanges: [],
      facilities: [],
      ratings: [],
      sort: 'recommended',
    };

    it('filters by single price range checkbox', () => {
      const state: FilterState = { ...defaultState, priceRanges: ['under-1000'] };
      const filtered = filterAndSortHolidays(holidays, state);
      assert.equal(filtered.length, 1);
      assert.equal(filtered[0].hotelName, 'Budget Inn Orlando');
      assert.equal(filtered[0].pricePerPerson, 799);
    });

    it('filters by multiple price range checkboxes (OR logic across price ranges)', () => {
      const state: FilterState = { ...defaultState, priceRanges: ['under-1000', '1500-2000'] };
      const filtered = filterAndSortHolidays(holidays, state);
      assert.equal(filtered.length, 2);
      const prices = filtered.map((h) => h.pricePerPerson).sort((a, b) => a - b);
      assert.deepEqual(prices, [799, 1705]);
    });

    it('filters by maxPrice per person', () => {
      const state: FilterState = { ...defaultState, maxPrice: 1200 };
      const filtered = filterAndSortHolidays(holidays, state);
      assert.ok(filtered.every((h) => h.pricePerPerson <= 1200));
      assert.equal(filtered.length, 2); // 799 and 1199
    });

    it('filters by required facilities (AND logic)', () => {
      const state: FilterState = { ...defaultState, facilities: ['Pool', 'Spa'] };
      const filtered = filterAndSortHolidays(holidays, state);
      assert.ok(filtered.every((h) => h.facilities.includes('Pool') && h.facilities.includes('Spa')));
      assert.equal(filtered.length, 1); // Lagoon Villas
    });

    it('filters by rating (OR logic among selected ratings)', () => {
      const state: FilterState = { ...defaultState, ratings: [5, 'Unrated'] };
      const filtered = filterAndSortHolidays(holidays, state);
      assert.equal(filtered.length, 2); // Lagoon Villas (5) and Beach Club Half Board (Unrated)
    });

    it('sorts by price low to high', () => {
      const state: FilterState = { ...defaultState, sort: 'price-asc' };
      const sorted = filterAndSortHolidays(holidays, state);
      assert.equal(sorted[0].pricePerPerson, 799);
      assert.equal(sorted[sorted.length - 1].pricePerPerson, 2560);
    });

    it('sorts by rating high to low', () => {
      const state: FilterState = { ...defaultState, sort: 'rating-desc' };
      const sorted = filterAndSortHolidays(holidays, state);
      assert.equal(sorted[0].effectiveRating, 5);
      assert.equal(sorted[sorted.length - 1].effectiveRating, null); // Unrated at end
    });
  });
});
