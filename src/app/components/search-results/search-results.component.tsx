'use client';

import React, { useMemo, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import searchResults from '../../../../fixtures/search-results.json';
import type { BookingResponse } from '@/types/booking';
import { Rooms } from '@/utils/composition.service';
import {
  normalizeHoliday,
  deriveFilterOptions,
  filterAndSortHolidays,
  FilterState,
  SortOption,
} from '@/utils/data-normalizer';
import { SearchSummary } from './search-summary.component';
import { FilterSidebar } from './filter-sidebar.component';
import { SortControl } from './sort-control.component';
import { HolidayCard } from './holiday-card.component';
import { EmptyState } from './empty-state.component';
import styles from './search-results.module.css';

type SearchParamsInput = { [key: string]: string | string[] | undefined };

export default function SearchResultsComponent({
  searchParams: initialSearchParams,
}: {
  searchParams: SearchParamsInput;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const urlSearchParams = useSearchParams();

  const getParam = useCallback(
    (key: string): string | undefined => {
      const fromUrl = urlSearchParams?.get(key);
      if (fromUrl !== null && fromUrl !== undefined) return fromUrl;
      const raw = initialSearchParams[key];
      return Array.isArray(raw) ? raw[0] : raw;
    },
    [urlSearchParams, initialSearchParams]
  );

  const location = getParam('location');
  const gateway = getParam('gateway');
  const departureDate = getParam('departureDate');
  const duration = getParam('duration') || '7';

  const partyFormatted = useMemo(() => {
    const rawParty = initialSearchParams.partyCompositions;
    const comps = Array.isArray(rawParty)
      ? rawParty
      : typeof rawParty === 'string'
      ? [rawParty]
      : [];
    if (comps.length > 0) {
      const parsed = Rooms.parseAndConvert(comps);
      if (parsed) return Rooms.prettyFormat(parsed);
    }
    return '2 people / 1 room';
  }, [initialSearchParams.partyCompositions]);

  const allHolidays = useMemo(() => {
    const fixture = searchResults as BookingResponse;
    const list = Array.isArray(fixture.holidays) ? fixture.holidays : [];
    return list.map((h, i) => normalizeHoliday(h, i));
  }, []);

  const searchFilteredHolidays = useMemo(() => {
    return allHolidays.filter((h) => {
      if (location) {
        const searchLoc = location.toLowerCase().replace('-', ' ');
        const parentLoc = h.parentLocation.toLowerCase();
        const hotelName = h.hotelName.toLowerCase();
        if (!parentLoc.includes(searchLoc) && !hotelName.includes(searchLoc)) {
          return false;
        }
      }
      return true;
    });
  }, [allHolidays, location]);

  const filterOptions = useMemo(() => {
    return deriveFilterOptions(searchFilteredHolidays);
  }, [searchFilteredHolidays]);

  const filterState: FilterState = useMemo(() => {
    const maxPriceParam = getParam('maxPrice');
    const minPriceParam = getParam('minPrice');
    const facilitiesParam = getParam('facilities');
    const ratingsParam = getParam('ratings');
    const sortParam = getParam('sort') as SortOption | undefined;

    const maxPrice = maxPriceParam ? Number(maxPriceParam) : null;
    const minPrice = minPriceParam ? Number(minPriceParam) : null;

    const facilities = facilitiesParam
      ? facilitiesParam.split(',').filter(Boolean)
      : [];

    const ratings: Array<number | 'Unrated'> = ratingsParam
      ? ratingsParam
          .split(',')
          .filter(Boolean)
          .map((r) => (r === 'Unrated' ? 'Unrated' : Number(r)))
      : [];

    const sort: SortOption =
      sortParam && ['recommended', 'price-asc', 'rating-desc'].includes(sortParam)
        ? sortParam
        : 'recommended';

    return {
      maxPrice: maxPrice !== null && !isNaN(maxPrice) ? maxPrice : null,
      minPrice: minPrice !== null && !isNaN(minPrice) ? minPrice : null,
      facilities,
      ratings,
      sort,
    };
  }, [getParam]);

  const updateUrlParams = useCallback(
    (newFilterState: Partial<FilterState>) => {
      const params = new URLSearchParams(urlSearchParams ? urlSearchParams.toString() : '');

      const nextMaxPrice =
        newFilterState.maxPrice !== undefined ? newFilterState.maxPrice : filterState.maxPrice;
      const nextMinPrice =
        newFilterState.minPrice !== undefined ? newFilterState.minPrice : filterState.minPrice;
      const nextFacilities =
        newFilterState.facilities !== undefined ? newFilterState.facilities : filterState.facilities;
      const nextRatings =
        newFilterState.ratings !== undefined ? newFilterState.ratings : filterState.ratings;
      const nextSort =
        newFilterState.sort !== undefined ? newFilterState.sort : filterState.sort;

      if (nextMaxPrice !== null && !isNaN(nextMaxPrice)) {
        params.set('maxPrice', String(nextMaxPrice));
      } else {
        params.delete('maxPrice');
      }

      if (nextMinPrice !== null && !isNaN(nextMinPrice)) {
        params.set('minPrice', String(nextMinPrice));
      } else {
        params.delete('minPrice');
      }

      if (nextFacilities.length > 0) {
        params.set('facilities', nextFacilities.join(','));
      } else {
        params.delete('facilities');
      }

      if (nextRatings.length > 0) {
        params.set('ratings', nextRatings.join(','));
      } else {
        params.delete('ratings');
      }

      if (nextSort && nextSort !== 'recommended') {
        params.set('sort', nextSort);
      } else {
        params.delete('sort');
      }

      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, urlSearchParams, filterState]
  );

  const handleFilterChange = (newState: Partial<FilterState>) => {
    updateUrlParams(newState);
  };

  const handleRemoveFacility = (facility: string) => {
    const updated = filterState.facilities.filter((f) => f !== facility);
    updateUrlParams({ facilities: updated });
  };

  const handleRemoveRating = (rating: number | 'Unrated') => {
    const updated = filterState.ratings.filter((r) => r !== rating);
    updateUrlParams({ ratings: updated });
  };

  const handleResetMaxPrice = () => {
    updateUrlParams({ maxPrice: null });
  };

  const handleResetAll = () => {
    updateUrlParams({
      maxPrice: null,
      minPrice: null,
      facilities: [],
      ratings: [],
      sort: 'recommended',
    });
  };

  const displayHolidays = useMemo(() => {
    return filterAndSortHolidays(searchFilteredHolidays, filterState);
  }, [searchFilteredHolidays, filterState]);

  return (
    <div className={styles.container}>
      <SearchSummary
        location={location}
        gateway={gateway}
        departureDate={departureDate}
        duration={duration}
        partyFormatted={partyFormatted}
        filterState={filterState}
        onRemoveFacility={handleRemoveFacility}
        onRemoveRating={handleRemoveRating}
        onResetMaxPrice={handleResetMaxPrice}
        onResetAll={handleResetAll}
      />

      <div className={styles.layout}>
        <FilterSidebar
          filterOptions={filterOptions}
          filterState={filterState}
          holidays={searchFilteredHolidays}
          onFilterChange={handleFilterChange}
          onResetAll={handleResetAll}
        />

        <main className={styles.mainContent}>
          <SortControl
            currentSort={filterState.sort}
            onSortChange={(sort) => updateUrlParams({ sort })}
            resultCount={displayHolidays.length}
          />

          {displayHolidays.length > 0 ? (
            <div className={styles.cardList}>
              {displayHolidays.map((holiday) => (
                <HolidayCard
                  key={holiday.uniqueKey}
                  holiday={holiday}
                  durationNights={duration}
                  partyFormatted={partyFormatted}
                />
              ))}
            </div>
          ) : (
            <EmptyState onReset={handleResetAll} />
          )}
        </main>
      </div>
    </div>
  );
}
