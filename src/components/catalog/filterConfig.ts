import type React from 'react';
import type { ImageSourcePropType } from 'react-native';
import type { CatalogBrandDto } from '../../services/api';

type SvgLogo = React.FC<{ width?: number; height?: number }>;

// Phase 2 filters: brand (from the catalog API), sort, price range.
// Oil-grade and can-size filters are intentionally gone until specifications become filterable.

export type SortOption = 'newest' | 'price_low_high' | 'price_high_low';

export type FilterSectionKey = 'brands' | 'sort' | 'priceRange';

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
  logo?: SvgLogo | ImageSourcePropType;
}

export interface FilterSection {
  key: FilterSectionKey;
  title: string;
  multi: boolean;
  options: FilterOption[];
}

export interface FilterSelections {
  // Brand ids as strings
  brands: string[];
  sort: SortOption | null;
  // At most one range is selected
  priceRange: string[];
}

export const EMPTY_FILTERS: FilterSelections = {
  brands: [],
  sort: null,
  priceRange: [],
};

const SORT_OPTIONS: FilterOption[] = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_low_high', label: 'Price: Low to High' },
  { value: 'price_high_low', label: 'Price: High to Low' },
];

interface PriceRange {
  value: string;
  label: string;
  min?: number;
  max?: number;
}

const PRICE_RANGES: PriceRange[] = [
  { value: 'under_500', label: 'Under ₹500', max: 499.99 },
  { value: '500_999', label: '₹500–₹999', min: 500, max: 999.99 },
  { value: '1000_1499', label: '₹1,000–₹1,499', min: 1000, max: 1499.99 },
  { value: '1500_1999', label: '₹1,500–₹1,999', min: 1500, max: 1999.99 },
  { value: '2000_2999', label: '₹2,000–₹2,999', min: 2000, max: 2999.99 },
  { value: '3000_up', label: '₹3,000 and above', min: 3000 },
];

/** Builds the filter sections; the brand options come from the catalog API. */
export function buildFilterSections(
  brands: CatalogBrandDto[],
): FilterSection[] {
  return [
    {
      key: 'brands',
      title: 'Brands',
      multi: true,
      options: brands.map(b => ({
        value: String(b.id),
        label: b.name,
        count: b.itemCount,
        logo: b.logoUrl ? { uri: b.logoUrl } : undefined,
      })),
    },
    { key: 'sort', title: 'Sort', multi: false, options: SORT_OPTIONS },
    {
      key: 'priceRange',
      title: 'Price Range',
      multi: false,
      options: PRICE_RANGES.map(r => ({ value: r.value, label: r.label })),
    },
  ];
}

/** The API's min/max price for the selected price range. */
export function priceBounds(selections: FilterSelections): {
  minPrice?: number;
  maxPrice?: number;
} {
  const range = PRICE_RANGES.find(r => r.value === selections.priceRange[0]);
  return { minPrice: range?.min, maxPrice: range?.max };
}

/** The API's sort value for the selected sort option. */
export function apiSort(
  sort: SortOption | null,
): 'newest' | 'price_asc' | 'price_desc' | undefined {
  switch (sort) {
    case 'newest':
      return 'newest';
    case 'price_low_high':
      return 'price_asc';
    case 'price_high_low':
      return 'price_desc';
    default:
      return undefined;
  }
}

export interface SelectedChip {
  sectionKey: FilterSectionKey;
  value: string;
  label: string;
  logo?: FilterOption['logo'];
}

export const getSelectedChips = (
  selections: FilterSelections,
  sections: FilterSection[],
): SelectedChip[] => {
  const chips: SelectedChip[] = [];
  sections.forEach(section => {
    const raw = selections[section.key];
    const values = Array.isArray(raw) ? raw : raw ? [raw] : [];
    values.forEach(value => {
      const option = section.options.find(o => o.value === value);
      if (!option) return;
      chips.push({
        sectionKey: section.key,
        value,
        label: section.key === 'sort' ? `Sort: ${option.label}` : option.label,
        logo: option.logo,
      });
    });
  });
  return chips;
};

export const countSelections = (
  selections: FilterSelections,
  sections: FilterSection[],
) => getSelectedChips(selections, sections).length;

export const removeSelection = (
  selections: FilterSelections,
  sectionKey: FilterSectionKey,
  value: string,
): FilterSelections =>
  sectionKey === 'sort'
    ? { ...selections, sort: null }
    : {
        ...selections,
        [sectionKey]: (selections[sectionKey] as string[]).filter(
          v => v !== value,
        ),
      };
