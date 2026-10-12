import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CatalogStackParamList } from '../navigation/CatalogStack';
import { useCart } from '../context/CartContext';
import RedHeader from '../components/catalog/RedHeader';
import { useTabBarHeight } from '../components/catalog/useTabBarHeight';
import PartProductCard, {
  PartProduct,
} from '../components/dashboard/PartProductCard';
import VehiclePicker from '../components/catalog/VehiclePicker';
import CatalogFilterBar from '../components/catalog/CatalogFilterBar';
import FiltersOverlay from '../components/catalog/FiltersOverlay';
import {
  EMPTY_FILTERS,
  FILTER_SECTIONS,
  countSelections,
  type FilterSectionKey,
  type FilterSelections,
} from '../components/catalog/filterConfig';
import CategorySidebar, {
  CatalogCategory,
} from '../components/catalog/CategorySidebar';
import CatalogCartBar from '../components/catalog/CatalogCartBar';
import ComingSoonOverlay from '../components/catalog/ComingSoonOverlay';

import CartIcon from '../assets/icons/cart.svg';
import SearchIcon from '../assets/icons/search.svg';
import OilImg from '../assets/images/oil_and_lubricant.png';
import ShockIcon from '../assets/icons/shock-absorber.svg';
import BodyIcon from '../assets/icons/body-parts.svg';
import LightingIcon from '../assets/icons/lighting.svg';
import BrakeIcon from '../assets/icons/brake-system.svg';
import ClutchIcon from '../assets/icons/clutch-system.svg';
import OilFilterImg from '../assets/images/oil-filter.png';

type SvgIcon = React.FC<{ width?: number; height?: number; color?: string }>;

// ── Dummy data (to be replaced with API responses) ────────────────────────────

const CATEGORIES: CatalogCategory[] = [
  { key: 'oil', label: 'Oil & Lubricant', image: OilImg },
  { key: 'shock', label: 'Suspension', Icon: ShockIcon as unknown as SvgIcon },
  { key: 'body', label: 'Body Parts', Icon: BodyIcon as unknown as SvgIcon },
  {
    key: 'lighting',
    label: 'Lighting',
    Icon: LightingIcon as unknown as SvgIcon,
  },
  {
    key: 'brake',
    label: 'Brake Systems',
    Icon: BrakeIcon as unknown as SvgIcon,
  },
  {
    key: 'clutch',
    label: 'Clutch System',
    Icon: ClutchIcon as unknown as SvgIcon,
  },
  { key: 'filter', label: 'Filters', image: OilFilterImg },
  // Dummy categories for testing sidebar scrolling
  {
    key: 'battery',
    label: 'Battery',
    Icon: LightingIcon as unknown as SvgIcon,
  },
  {
    key: 'tyres',
    label: 'Tyres & Wheels',
    Icon: ClutchIcon as unknown as SvgIcon,
  },
  {
    key: 'engine',
    label: 'Engine Parts',
    Icon: ShockIcon as unknown as SvgIcon,
  },
  { key: 'wipers', label: 'Wipers', Icon: BodyIcon as unknown as SvgIcon },
  {
    key: 'electrical',
    label: 'Electricals',
    Icon: BrakeIcon as unknown as SvgIcon,
  },
  { key: 'ac', label: 'AC & Cooling', image: OilImg },
];

const COMPATIBLE_VEHICLES = [
  'Toyota Innova Crysta 2.4 ZX MT DSL 2018',
  'Toyota Innova Crysta 2.8 VX MT DSL 2018',
  'Toyota Innova Crysta 2.8 VX MT DSL 2019',
  'Toyota Innova Crysta 2.8 ZX MT DSL 2019',
];

const MOCK_PRODUCTS: PartProduct[] = [
  {
    id: '1',
    sku: 'Val-0000001',
    name: 'All Climate Advanced 5W30',
    brand: 'Valvoline',
    price: 1600,
    mrp: 2100,
    image: OilFilterImg,
    volume: '3.5 Ltrs',
    category: 'Oil & Lubricant',
    images: [OilFilterImg, OilFilterImg, OilFilterImg],
    compatibleVehicles: COMPATIBLE_VEHICLES,
  },
  {
    id: '2',
    sku: 'Val-0000002',
    name: 'All Climate Dsl/Ptl 15W40',
    brand: 'Valvoline',
    price: 1050,
    mrp: 1600,
    image: OilFilterImg,
    volume: '3.5 Ltrs',
    category: 'Oil & Lubricant',
    images: [OilFilterImg, OilFilterImg, OilFilterImg],
    compatibleVehicles: COMPATIBLE_VEHICLES,
  },
  {
    id: '3',
    sku: 'Val-0000003',
    name: 'All Climate Modern 5W30',
    brand: 'Valvoline',
    price: 1250,
    mrp: 1800,
    image: OilFilterImg,
    volume: '3.5 Ltrs',
    category: 'Oil & Lubricant',
    images: [OilFilterImg, OilFilterImg, OilFilterImg],
    compatibleVehicles: COMPATIBLE_VEHICLES,
    badge: 'On Order',
  },
  {
    id: '4',
    sku: 'Val-0000004',
    name: 'Synpower 5W40',
    brand: 'Valvoline',
    price: 1900,
    mrp: 2500,
    image: OilFilterImg,
    volume: '3.5 Ltrs',
    category: 'Oil & Lubricant',
    images: [OilFilterImg, OilFilterImg, OilFilterImg],
    compatibleVehicles: COMPATIBLE_VEHICLES,
  },
  {
    id: '5',
    sku: 'TM-0000001',
    name: 'CI4+ 15W40 Diesel Engine Oil',
    brand: 'TATA Motors Genuine Oil',
    price: 900,
    mrp: 1100,
    image: OilFilterImg,
    badge: 'Out of Stock',
    outOfStock: true,
    volume: '3.5 Ltrs',
    category: 'Oil & Lubricant',
    images: [OilFilterImg, OilFilterImg, OilFilterImg],
    compatibleVehicles: COMPATIBLE_VEHICLES,
  },
  {
    id: '6',
    sku: 'TY-0000001',
    name: '5W30 Toyota Value Semi Synthetic Engine Oil',
    brand: 'Toyota Value',
    price: 2190,
    mrp: 2400,
    image: OilFilterImg,
    volume: '3.5 Ltrs',
    category: 'Oil & Lubricant',
    images: [OilFilterImg, OilFilterImg, OilFilterImg],
    compatibleVehicles: COMPATIBLE_VEHICLES,
  },
];

// While the catalog backend is not live, the whole screen is covered by a non-dismissible
// "Coming Soon" overlay and its content is disabled. Set to false to restore the screen.
const CATALOG_COMING_SOON = true;

// Cart badge shows the exact count up to this number, then "N+".
const CART_BADGE_MAX = 3;

// Chips shown in the filter bar; each opens the Filters sheet on the matching section.
const CHIP_LABELS = ['Sort', 'Brands', 'Oil Grade', 'Can Size', 'Price Range'];

// ── Screen ────────────────────────────────────────────────────────────────────

export default function CatalogScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<CatalogStackParamList>>();
  const tabBarHeight = useTabBarHeight();
  const {
    quantities,
    count: cartCount,
    addItem,
    increment,
    decrement,
  } = useCart();

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = () => {
    // No data source to refresh yet — just show the spinner briefly.
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  const [selectedCategory, setSelectedCategory] = useState('oil');
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<FilterSelections>(EMPTY_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filtersSection, setFiltersSection] =
    useState<FilterSectionKey>('brands');
  const sortBy = filters.sort;
  const openFilters = (section: FilterSectionKey) => {
    setFiltersSection(section);
    setFiltersOpen(true);
  };

  const activeDropdowns = FILTER_SECTIONS.filter(section => {
    const value = filters[section.key];
    return Array.isArray(value) ? value.length > 0 : value !== null;
  }).map(section => section.title);

  // Search looks across every category; every typed word must match somewhere.
  const searchTerms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const isSearching = searchTerms.length > 0;
  const matchesSearch = (p: PartProduct) => {
    const haystack = [p.name, p.sku, p.brand, p.volume, p.category]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return searchTerms.every(term => haystack.includes(term));
  };
  const closeSearch = () => {
    setSearchOpen(false);
    setQuery('');
  };

  const categoryProducts = isSearching
    ? MOCK_PRODUCTS.filter(matchesSearch)
    : selectedCategory === 'oil'
    ? MOCK_PRODUCTS
    : [];
  const products = sortBy
    ? [...categoryProducts].sort((a, b) =>
        sortBy === 'price_low_high' ? a.price - b.price : b.price - a.price,
      )
    : categoryProducts;

  return (
    <View style={styles.container}>
      {/* Content stays visible behind the overlay, but cannot be touched or read by screen readers */}
      <View
        style={styles.content}
        pointerEvents={CATALOG_COMING_SOON ? 'none' : 'auto'}
        accessibilityElementsHidden={CATALOG_COMING_SOON}
        importantForAccessibility={
          CATALOG_COMING_SOON ? 'no-hide-descendants' : 'auto'
        }
      >
        <RedHeader
          title="Catalog"
          onBack={() => (searchOpen ? closeSearch() : navigation.goBack())}
          search={{
            active: searchOpen,
            value: query,
            onChange: setQuery,
            onClose: closeSearch,
            placeholder: 'Search parts, brands or part numbers',
          }}
          right={
            <View style={styles.headerRight}>
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.headerBtn}
                onPress={() => setSearchOpen(true)}
              >
                <SearchIcon width={22} height={22} color="#ffffff" />
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.headerBtn}
                onPress={() => navigation.navigate('MyCart')}
              >
                <CartIcon width={24} height={24} color="#ffffff" />
                {cartCount > 0 && (
                  <View style={styles.cartBadge}>
                    <Text style={styles.cartBadgeText}>
                      {cartCount > CART_BADGE_MAX
                        ? `${CART_BADGE_MAX}+`
                        : cartCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          }
        />

        <View style={styles.body}>
          <CategorySidebar
            categories={CATEGORIES}
            selectedKey={selectedCategory}
            onSelect={setSelectedCategory}
            bottomInset={tabBarHeight}
          />

          <View style={styles.main}>
            <View style={styles.topControls}>
              <VehiclePicker />
              <CatalogFilterBar
                appliedCount={countSelections(filters)}
                onOpenFilters={() => openFilters('brands')}
                onClear={() => setFilters(EMPTY_FILTERS)}
                activeDropdowns={activeDropdowns}
                dropdowns={CHIP_LABELS}
                onPressDropdown={label => {
                  const section = FILTER_SECTIONS.find(
                    sec => sec.title === label,
                  );
                  if (section) openFilters(section.key);
                }}
              />
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[
                styles.grid,
                { paddingBottom: tabBarHeight + (cartCount > 0 ? 68 : 16) },
              ]}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={['#e5383b']}
                  tintColor="#e5383b"
                />
              }
            >
              {isSearching && products.length > 0 && (
                <Text style={styles.resultsText}>
                  {products.length}{' '}
                  {products.length === 1 ? 'result' : 'results'} for “
                  {query.trim()}”
                </Text>
              )}
              {products.length > 0 ? (
                products.map(product => (
                  <View key={product.id} style={styles.gridItem}>
                    <PartProductCard
                      product={product}
                      quantity={quantities[product.id] ?? 0}
                      onAdd={() => addItem(product)}
                      onIncrement={increment}
                      onDecrement={decrement}
                      onPress={p =>
                        navigation.navigate('PartDetail', {
                          product: p,
                          categoryTitle:
                            CATEGORIES.find(c => c.key === selectedCategory)
                              ?.label ?? 'Catalog',
                        })
                      }
                    />
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>
                  {isSearching
                    ? `No parts found for “${query.trim()}”`
                    : 'No products in this category yet'}
                </Text>
              )}
            </ScrollView>
          </View>
        </View>

        <FiltersOverlay
          isOpen={filtersOpen}
          onClose={() => setFiltersOpen(false)}
          selections={filters}
          onApply={setFilters}
          initialSection={filtersSection}
        />

        <CatalogCartBar
          count={cartCount}
          bottom={tabBarHeight - 3}
          onPress={() => navigation.navigate('MyCart')}
        />
      </View>

      {CATALOG_COMING_SOON && <ComingSoonOverlay />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  content: { flex: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  headerBtn: { width: 32, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, flexDirection: 'row' },
  main: { flex: 1, paddingRight: 10 },
  topControls: { gap: 10, paddingTop: 10, paddingBottom: 10 },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  gridItem: { width: '48.5%' },
  resultsText: {
    width: '100%',
    fontSize: 13,
    color: '#99a2b6',
  },
  emptyText: {
    fontSize: 14,
    color: '#99a2b6',
    paddingTop: 20,
    alignSelf: 'center',
  },

  cartBadge: {
    position: 'absolute',
    top: -6,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: { fontSize: 11, fontWeight: '700', color: '#e5383b' },
});
