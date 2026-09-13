import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { HolidayCard } from './holiday-card.component';
import type { NormalizedHoliday } from '@/utils/data-normalizer';

const baseHoliday: NormalizedHoliday = {
  id: 'hotel-1',
  uniqueKey: 'hotel-1_room-only_2026-10-01_0',
  hotelId: 'hotel-1',
  hotelName: 'Sunset Resort',
  parentLocation: 'Tenerife',
  hotelLocation: ['Costa Adeje'],
  boardBasis: 'All Inclusive',
  vRating: 4.5,
  starRating: 5,
  effectiveRating: 4.5,
  ratingDisplay: '4.5',
  totalPrice: 1200,
  pricePerPerson: 600,
  flyingClubMiles: 0,
  virginPoints: 250,
  tierPoints: 0,
  departureDate: '2026-10-01',
  selectedDate: '2026-10-01',
  description: 'A lovely beachside hotel.',
  atAGlance: ['Beachfront', 'Family Friendly'],
  facilities: ['Pool', 'WiFi'],
  imageUrl: 'https://example.com/image.jpg',
  holidayType: ['Family'],
  accommodationType: ['Hotel'],
  propertyType: 'Resort',
};

describe('HolidayCard', () => {
  it('renders core holiday information and formatted prices', () => {
    const html = renderToStaticMarkup(
      <HolidayCard holiday={baseHoliday} durationNights="10" partyFormatted="2 adults / 1 room" />
    );

    assert.ok(html.includes('Sunset Resort'));
    assert.ok(html.includes('All Inclusive'));
    assert.ok(html.includes('★ 4.5'));
    assert.ok(html.includes('£600'));
    assert.ok(html.includes('£1,200 total (10 nights, 2 adults / 1 room)'));
    assert.ok(html.includes('Earn 250 Virgin Points'));
  });

  it('uses default duration and party text when not provided', () => {
    const html = renderToStaticMarkup(<HolidayCard holiday={baseHoliday} />);
    assert.ok(html.includes('7 nights, 2 people / 1 room'));
  });

  it('shows placeholder when imageUrl is missing', () => {
    const holidayNoImage = { ...baseHoliday, imageUrl: null };
    const html = renderToStaticMarkup(<HolidayCard holiday={holidayNoImage} />);

    assert.ok(html.includes('Photo unavailable'));
    assert.ok(html.includes("Image couldn&#x27;t be loaded."));
  });

  it('renders Unrated text when effectiveRating is null', () => {
    const unratedHoliday: NormalizedHoliday = {
      ...baseHoliday,
      vRating: null,
      starRating: null,
      effectiveRating: null,
      ratingDisplay: 'Unrated',
    };
    const html = renderToStaticMarkup(<HolidayCard holiday={unratedHoliday} />);

    assert.ok(html.includes('Unrated'));
  });

  it('renders only the first 4 unique highlight chips', () => {
    const holidayWithManyHighlights: NormalizedHoliday = {
      ...baseHoliday,
      atAGlance: ['Beachfront', 'Family Friendly', 'Spa', 'Gym'],
      facilities: ['Pool', 'WiFi', 'Gym', 'Kids Club'],
    };

    const html = renderToStaticMarkup(<HolidayCard holiday={holidayWithManyHighlights} />);

    assert.ok(html.includes('Beachfront'));
    assert.ok(html.includes('Family Friendly'));
    assert.ok(html.includes('Spa'));
    assert.ok(html.includes('Gym'));
    assert.equal(html.includes('Kids Club'), false);
  });
});