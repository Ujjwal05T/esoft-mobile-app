import type React from 'react';
import type { ImageSourcePropType } from 'react-native';
import TataMotors from '../../assets/logos/tata-motors.svg';
import Toyota from '../../assets/logos/toyota.svg';
import Mahindra from '../../assets/logos/mahindra.svg';
import Suzuki from '../../assets/logos/suzuki.svg';
import Hyundai from '../../assets/logos/hyundai.svg';
import ValvolineLogo from '../../assets/logos/volvoline-logo.png';

type SvgLogo = React.FC<{ width?: number; height?: number }>;

export type SortOption =
  | 'relevance'
  | 'popularity'
  | 'price_low_high'
  | 'price_high_low'
  | 'rating'
  | 'newest';

export type FilterSectionKey =
  | 'brands'
  | 'oilGrade'
  | 'sort'
  | 'canSize'
  | 'priceRange';

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
  brands: string[];
  oilGrade: string[];
  sort: SortOption | null;
  canSize: string[];
  priceRange: string[];
}

export const EMPTY_FILTERS: FilterSelections = {
  brands: [],
  oilGrade: [],
  sort: null,
  canSize: [],
  priceRange: [],
};

const svg = (c: unknown) => c as SvgLogo;

// Dummy options (to be replaced with API-driven facets)
export const FILTER_SECTIONS: FilterSection[] = [
  {
    key: 'brands',
    title: 'Brands',
    multi: true,
    options: [
      { value: 'tata', label: 'Tata Motors', count: 3, logo: svg(TataMotors) },
      {
        value: 'valvoline',
        label: 'Valvoline',
        count: 12,
        logo: ValvolineLogo,
      },
      { value: 'suzuki', label: 'Maruti Suzuki', count: 5, logo: svg(Suzuki) },
      { value: 'hyundai', label: 'Hyundai', count: 1, logo: svg(Hyundai) },
      { value: 'mahindra', label: 'Mahindra', count: 2, logo: svg(Mahindra) },
      { value: 'toyota', label: 'Toyota', count: 4, logo: svg(Toyota) },
    ],
  },
  {
    key: 'oilGrade',
    title: 'Oil Grade',
    multi: true,
    options: [
      { value: '0W-20', label: '0W-20', count: 2 },
      { value: '0W-30', label: '0W-30', count: 2 },
      { value: '5W-20', label: '5W-20', count: 1 },
      { value: '5W-30', label: '5W-30', count: 4 },
      { value: '5W-40', label: '5W-40', count: 4 },
      { value: '10W-40', label: '10W-40', count: 1 },
      { value: '10W-30', label: '10W-30', count: 2 },
      { value: '15W-40', label: '15W-40', count: 4 },
    ],
  },
  {
    key: 'sort',
    title: 'Sort',
    multi: false,
    options: [
      { value: 'relevance', label: 'Relevance' },
      { value: 'popularity', label: 'Popularity' },
      { value: 'price_low_high', label: 'Price: Low to High' },
      { value: 'price_high_low', label: 'Price: High to Low' },
      { value: 'rating', label: 'Customer Rating' },
      { value: 'newest', label: 'Newest First' },
    ],
  },
  {
    key: 'canSize',
    title: 'Can Size',
    multi: true,
    options: [
      '500 ml',
      '1 L',
      '3 L',
      '3.5 L',
      '4 L',
      '5 L',
      '7 L',
      '10 L',
      '20 L',
    ].map(v => ({
      value: v,
      label: v,
    })),
  },
  {
    key: 'priceRange',
    title: 'Price Range',
    multi: true,
    options: [
      'Under ₹500',
      '₹500–₹999',
      '₹1,000–₹1,499',
      '₹1,500–₹1,999',
      '₹2,000–₹2,999',
      '₹3,000 and above',
    ].map(v => ({ value: v, label: v })),
  },
];

export interface SelectedChip {
  sectionKey: FilterSectionKey;
  value: string;
  label: string;
  logo?: FilterOption['logo'];
}

export const getSelectedChips = (
  selections: FilterSelections,
): SelectedChip[] => {
  const chips: SelectedChip[] = [];
  FILTER_SECTIONS.forEach(section => {
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

export const countSelections = (selections: FilterSelections) =>
  getSelectedChips(selections).length;

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
