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

import CartIcon from '../assets/icons/cart.svg';
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

  const categoryProducts = selectedCategory === 'oil' ? MOCK_PRODUCTS : [];
  const products = sortBy
    ? [...categoryProducts].sort((a, b) =>
        sortBy === 'price_low_high' ? a.price - b.price : b.price - a.price,
      )
    : categoryProducts;

  return (
    <View style={styles.container}>
      <RedHeader
        title="Catalog"
        onBack={() => navigation.goBack()}
        right={
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
              { paddingBottom: tabBarHeight + 16 },
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
                No products in this category yet
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
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
