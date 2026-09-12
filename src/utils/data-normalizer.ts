import type { Holiday } from '@/types/booking';

export interface NormalizedHoliday {
  id: string;
  uniqueKey: string;
  hotelId: string;
  hotelName: string;
  parentLocation: string;
  hotelLocation: string[];
  boardBasis: string;
  vRating: number | null;
  starRating: number | null;
  effectiveRating: number | null;
  ratingDisplay: string;
  totalPrice: number;
  pricePerPerson: number;
  flyingClubMiles: number;
  virginPoints: number;
  tierPoints: number;
  departureDate: string;
  selectedDate: string;
  description: string;
  atAGlance: string[];
  facilities: string[];
  imageUrl: string | null;
  holidayType: string[];
  accommodationType: string[];
  propertyType: string;
}

export interface FilterOptions {
  minPrice: number;
  maxPrice: number;
  availableFacilities: string[];
  availableRatings: Array<number | 'Unrated'>;
}

export type SortOption = 'recommended' | 'price-asc' | 'rating-desc';

export interface FilterState {
  maxPrice: number | null;
  minPrice: number | null;
  facilities: string[];
  ratings: Array<number | 'Unrated'>;
  sort: SortOption;
}

export function parseRating(rating: number | string | undefined | null): number | null {
  if (rating === undefined || rating === null) return null;
  if (typeof rating === 'number') return isNaN(rating) ? null : rating;
  if (typeof rating === 'string') {
    const trimmed = rating.trim();
    if (trimmed === '' || trimmed.toLowerCase() === 'unrated') return null;
    const parsed = parseFloat(trimmed);
    return isNaN(parsed) ? null : parsed;
  }
  return null;
}

export function normalizeFacility(facility: string): string {
  if (!facility) return '';
  const trimmed = facility.trim();
  if (!trimmed) return '';

  const lower = trimmed.toLowerCase();
  if (lower === 'free wifi' || lower === 'wifi' || lower === 'free wi-fi') {
    return 'Free WiFi';
  }
  if (lower === 'kids club' || lower === 'kids\' club' || lower === 'children\'s club') {
    return 'Kids Club';
  }

  return trimmed.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.substring(1).toLowerCase());
}

export function normalizeHoliday(holiday: Holiday, index: number): NormalizedHoliday {
  const hotel = holiday.hotel;
  const content = hotel?.content || {};

  const vRatingNum = parseRating(content.vRating);
  const starRatingNum = parseRating(content.starRating);
  const effectiveRating = vRatingNum ?? starRatingNum ?? null;
  const ratingDisplay = effectiveRating !== null ? `${effectiveRating}` : 'Unrated';

  const rawFacilities = Array.isArray(content.hotelFacilities) ? content.hotelFacilities : [];
  const facilityMap = new Map<string, string>();
  for (const raw of rawFacilities) {
    const norm = normalizeFacility(raw);
    if (norm) {
      const key = norm.toLowerCase();
      if (!facilityMap.has(key)) {
        facilityMap.set(key, norm);
      }
    }
  }
  const facilities = Array.from(facilityMap.values()).sort();

  let imageUrl: string | null = null;
  if (Array.isArray(content.images) && content.images.length > 0) {
    const carouselImg = content.images.find((img) => img?.RESULTS_CAROUSEL?.url)?.RESULTS_CAROUSEL?.url;
    if (carouselImg) {
      imageUrl = carouselImg;
    }
  }

  const hotelId = hotel?.id || `hotel-${index}`;
  const boardBasis = hotel?.boardBasis || (Array.isArray(content.boardBasis) && content.boardBasis[0]) || 'Room Only';
  const selectedDate = holiday.selectedDate || holiday.departureDate || '';
  const uniqueKey = `${hotelId}_${boardBasis.toLowerCase().replace(/\s+/g, '-')}_${selectedDate}_${index}`;

  return {
    id: hotelId,
    uniqueKey,
    hotelId,
    hotelName: content.name || hotel?.name || 'Hotel',
    parentLocation: content.parentLocation || '',
    hotelLocation: Array.isArray(content.hotelLocation) ? content.hotelLocation : [],
    boardBasis,
    vRating: vRatingNum,
    starRating: starRatingNum,
    effectiveRating,
    ratingDisplay,
    totalPrice: typeof holiday.totalPrice === 'number' ? holiday.totalPrice : 0,
    pricePerPerson: typeof holiday.pricePerPerson === 'number' ? holiday.pricePerPerson : 0,
    flyingClubMiles: typeof holiday.flyingClubMiles === 'number' ? holiday.flyingClubMiles : 0,
    virginPoints: typeof holiday.virginPoints === 'number' ? holiday.virginPoints : 0,
    tierPoints: typeof holiday.tierPoints === 'number' ? holiday.tierPoints : 0,
    departureDate: holiday.departureDate || '',
    selectedDate,
    description: content.hotelDescription || '',
    atAGlance: Array.isArray(content.atAGlance) ? content.atAGlance : [],
    facilities,
    imageUrl,
    holidayType: Array.isArray(content.holidayType) ? content.holidayType : [],
    accommodationType: Array.isArray(content.accommodationType) ? content.accommodationType : [],
    propertyType: content.propertyType || '',
  };
}

export function deriveFilterOptions(holidays: NormalizedHoliday[]): FilterOptions {
  if (holidays.length === 0) {
    return {
      minPrice: 0,
      maxPrice: 5000,
      availableFacilities: [],
      availableRatings: [],
    };
  }

  let minPrice = Infinity;
  let maxPrice = -Infinity;
  const facilitySet = new Set<string>();
  const ratingSet = new Set<number | 'Unrated'>();

  for (const h of holidays) {
    if (h.pricePerPerson < minPrice) minPrice = h.pricePerPerson;
    if (h.pricePerPerson > maxPrice) maxPrice = h.pricePerPerson;

    for (const f of h.facilities) {
      facilitySet.add(f);
    }

    if (h.effectiveRating !== null) {
      ratingSet.add(h.effectiveRating);
    } else {
      ratingSet.add('Unrated');
    }
  }

  const availableFacilities = Array.from(facilitySet).sort();

  const availableRatings = Array.from(ratingSet).sort((a, b) => {
    if (a === 'Unrated') return 1;
    if (b === 'Unrated') return -1;
    return (b as number) - (a as number);
  });

  return {
    minPrice: isFinite(minPrice) ? minPrice : 0,
    maxPrice: isFinite(maxPrice) ? maxPrice : 5000,
    availableFacilities,
    availableRatings,
  };
}

export function filterAndSortHolidays(
  holidays: NormalizedHoliday[],
  filterState: FilterState
): NormalizedHoliday[] {
  let results = holidays.filter((h) => {
    if (filterState.maxPrice !== null && h.pricePerPerson > filterState.maxPrice) {
      return false;
    }
    if (filterState.minPrice !== null && h.pricePerPerson < filterState.minPrice) {
      return false;
    }

    if (filterState.facilities.length > 0) {
      const holidayFacilitiesLower = new Set(h.facilities.map((f) => f.toLowerCase()));
      const matchesAllFacilities = filterState.facilities.every((req) =>
        holidayFacilitiesLower.has(req.toLowerCase())
      );
      if (!matchesAllFacilities) return false;
    }

    if (filterState.ratings.length > 0) {
      const match = filterState.ratings.some((selectedRating) => {
        if (selectedRating === 'Unrated') {
          return h.effectiveRating === null;
        }
        return h.effectiveRating === selectedRating;
      });
      if (!match) return false;
    }

    return true;
  });

  if (filterState.sort === 'price-asc') {
    results = [...results].sort((a, b) => a.pricePerPerson - b.pricePerPerson);
  } else if (filterState.sort === 'rating-desc') {
    results = [...results].sort((a, b) => {
      const ratingA = a.effectiveRating ?? -1;
      const ratingB = b.effectiveRating ?? -1;
      if (ratingA !== ratingB) return ratingB - ratingA;
      return a.pricePerPerson - b.pricePerPerson;
    });
  }

  return results;
}
