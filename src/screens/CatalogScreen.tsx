import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CatalogStackParamList } from '../navigation/CatalogStack';
import { useCart } from '../context/CartContext';
import RedHeader from '../components/catalog/RedHeader';
import { useTabBarHeight } from '../components/catalog/useTabBarHeight';
import PartProductCard from '../components/dashboard/PartProductCard';
import VehiclePicker from '../components/catalog/VehiclePicker';
import CatalogFilterBar from '../components/catalog/CatalogFilterBar';
import FiltersOverlay from '../components/catalog/FiltersOverlay';
import {
  EMPTY_FILTERS,
  apiSort,
  buildFilterSections,
  countSelections,
  priceBounds,
  type FilterSectionKey,
  type FilterSelections,
} from '../components/catalog/filterConfig';
import CategorySidebar, {
  CatalogCategory,
} from '../components/catalog/CategorySidebar';
import CatalogCartBar from '../components/catalog/CatalogCartBar';
import { toPartProduct } from '../components/catalog/catalogMapping';
import { getVehicleFullName } from '../components/catalog/SelectCarOverlay';
import {
  getCatalogBrands,
  getCatalogCategories,
  getCatalogProducts,
  type CatalogBrandDto,
  type CatalogCategoryDto,
  type CatalogItemSummary,
} from '../services/api';

import CartIcon from '../assets/icons/cart.svg';
import SearchIcon from '../assets/icons/search.svg';

const ALL_KEY = 'all';
const PAGE_SIZE = 20;

// Cart badge shows the exact count up to this number, then "N+".
const CART_BADGE_MAX = 3;

// Chips shown in the filter bar; each opens the Filters sheet on the matching section.
const CHIP_LABELS = ['Sort', 'Brands', 'Price Range'];

const AllPartsIcon = ({ width = 44, height = 44, color = '#e5383b' }) => (
  <Svg width={width} height={height} viewBox="0 0 44 44" fill="none">
    <Rect x={8} y={8} width={12} height={12} rx={3} fill={color} />
    <Rect
      x={24}
      y={8}
      width={12}
      height={12}
      rx={3}
      fill={color}
      opacity={0.6}
    />
    <Rect
      x={8}
      y={24}
      width={12}
      height={12}
      rx={3}
      fill={color}
      opacity={0.6}
    />
    <Rect x={24} y={24} width={12} height={12} rx={3} fill={color} />
  </Svg>
);

// ── Screen ────────────────────────────────────────────────────────────────────

export default function CatalogScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<CatalogStackParamList>>();
  const tabBarHeight = useTabBarHeight();
  const {
    quantities,
    count: cartCount,
    vehicle,
    setVehicle,
    addItem,
    increment,
    decrement,
  } = useCart();

  // Bumped to reload everything (pull to refresh, retry)
  const [reloadToken, setReloadToken] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const [categories, setCategories] = useState<CatalogCategoryDto[]>([]);
  const [brands, setBrands] = useState<CatalogBrandDto[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(ALL_KEY);
  const [filters, setFilters] = useState<FilterSelections>(EMPTY_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filtersSection, setFiltersSection] =
    useState<FilterSectionKey>('brands');
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  const [list, setList] = useState<{
    items: CatalogItemSummary[];
    total: number;
    page: number;
  }>({ items: [], total: 0, page: 0 });
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(
    'loading',
  );
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  // Ignores answers to requests that a newer filter change has already replaced
  const requestId = useRef(0);

  const categoryId =
    selectedCategory === ALL_KEY ? undefined : Number(selectedCategory);
  const trimmedQuery = debouncedQuery.trim();
  const isSearching = trimmedQuery.length > 0;

  const openFilters = (section: FilterSectionKey) => {
    setFiltersSection(section);
    setFiltersOpen(true);
  };

  // Debounce the search box so we do not call the API on every keystroke
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 350);
    return () => clearTimeout(t);
  }, [query]);

  // Categories for the sidebar
  useEffect(() => {
    let cancelled = false;
    getCatalogCategories().then(res => {
      if (cancelled || !res.success || !res.data) return;
      const data = res.data;
      setCategories(data);
      // A category hidden since the last load must not stay selected
      setSelectedCategory(prev =>
        prev === ALL_KEY || data.some(c => String(c.id) === prev)
          ? prev
          : ALL_KEY,
      );
    });
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  // Brand filter options (counts follow the selected category)
  useEffect(() => {
    let cancelled = false;
    getCatalogBrands(categoryId).then(res => {
      if (!cancelled && res.success && res.data) setBrands(res.data);
    });
    return () => {
      cancelled = true;
    };
  }, [categoryId, reloadToken]);

  const sections = useMemo(() => buildFilterSections(brands), [brands]);

  const bounds = priceBounds(filters);
  const buildQuery = (page: number) => ({
    // Searching looks across every category
    categoryId: isSearching ? undefined : categoryId,
    brandIds: filters.brands.map(Number),
    q: trimmedQuery,
    minPrice: bounds.minPrice,
    maxPrice: bounds.maxPrice,
    sort: apiSort(filters.sort),
    // With a vehicle selected, only parts that fit it are returned
    vehicleId: vehicle?.id,
    page,
    pageSize: PAGE_SIZE,
  });

  // Reload the first page whenever any filter changes
  const filterKey = JSON.stringify([
    categoryId,
    filters,
    trimmedQuery,
    vehicle?.id,
    reloadToken,
  ]);
  useEffect(() => {
    const id = ++requestId.current;
    setStatus('loading');
    setError(null);
    getCatalogProducts(buildQuery(1)).then(res => {
      if (id !== requestId.current) return;
      setRefreshing(false);
      if (res.success && res.data) {
        setList({ items: res.data.items, total: res.data.total, page: 1 });
        setStatus('ready');
      } else {
        setError(res.error ?? 'Could not load parts.');
        setStatus('error');
      }
    });
    // buildQuery is derived from filterKey's inputs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

  const loadMore = () => {
    if (loadingMore || status !== 'ready' || list.items.length >= list.total) {
      return;
    }
    const id = requestId.current;
    setLoadingMore(true);
    getCatalogProducts(buildQuery(list.page + 1))
      .then(res => {
        if (id !== requestId.current || !res.success || !res.data) return;
        const next = res.data;
        setList(prev => ({
          items: [...prev.items, ...next.items],
          total: next.total,
          page: prev.page + 1,
        }));
      })
      .finally(() => setLoadingMore(false));
  };

  const onRefresh = () => {
    setRefreshing(true);
    setReloadToken(t => t + 1);
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setQuery('');
    setDebouncedQuery('');
  };

  // The selected vehicle is a filter too, so it counts here and "Clear all" resets it
  const appliedCount = countSelections(filters, sections) + (vehicle ? 1 : 0);
  const hasActiveFilters = appliedCount > 0 || isSearching;
  const clearAll = () => {
    setFilters(EMPTY_FILTERS);
    setVehicle(null);
    closeSearch();
  };

  const activeDropdowns = sections
    .filter(section => {
      const value = filters[section.key];
      return Array.isArray(value) ? value.length > 0 : value !== null;
    })
    .map(section => section.title);

  const sidebarCategories: CatalogCategory[] = [
    { key: ALL_KEY, label: 'All Parts', Icon: AllPartsIcon },
    ...categories.map(c => ({
      key: String(c.id),
      label: c.name,
      imageUrl: c.iconUrl,
    })),
  ];

  const emptyMessage = isSearching
    ? `No parts found for “${trimmedQuery}”`
    : vehicle
    ? `No parts found for ${getVehicleFullName(
        vehicle,
      )}. Try another vehicle or clear the filters.`
    : 'No products in this category yet';

  return (
    <View style={styles.container}>
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
          categories={sidebarCategories}
          selectedKey={selectedCategory}
          onSelect={setSelectedCategory}
          bottomInset={tabBarHeight}
        />

        <View style={styles.main}>
          <View style={styles.topControls}>
            <VehiclePicker />
            <CatalogFilterBar
              appliedCount={appliedCount}
              onOpenFilters={() => openFilters('brands')}
              onClear={clearAll}
              activeDropdowns={activeDropdowns}
              dropdowns={CHIP_LABELS}
              onPressDropdown={label => {
                const section = sections.find(sec => sec.title === label);
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
            scrollEventThrottle={200}
            onScroll={e => {
              const { layoutMeasurement, contentOffset, contentSize } =
                e.nativeEvent;
              if (
                layoutMeasurement.height + contentOffset.y >=
                contentSize.height - 400
              ) {
                loadMore();
              }
            }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#e5383b']}
                tintColor="#e5383b"
              />
            }
          >
            {status === 'loading' && list.items.length === 0 ? (
              <View style={styles.center}>
                <ActivityIndicator color="#e5383b" />
              </View>
            ) : status === 'error' ? (
              <View style={styles.center}>
                <Text style={styles.emptyText}>{error}</Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.retryBtn}
                  onPress={() => setReloadToken(t => t + 1)}
                >
                  <Text style={styles.retryText}>Try again</Text>
                </TouchableOpacity>
              </View>
            ) : list.items.length === 0 ? (
              <View style={styles.center}>
                <Text style={styles.emptyText}>{emptyMessage}</Text>
                {hasActiveFilters && (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.retryBtn}
                    onPress={clearAll}
                  >
                    <Text style={styles.retryText}>Clear all filters</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <>
                {isSearching && (
                  <Text style={styles.resultsText}>
                    {list.total} {list.total === 1 ? 'result' : 'results'} for “
                    {trimmedQuery}”
                  </Text>
                )}
                {list.items.map(item => {
                  const product = toPartProduct(item);
                  return (
                    <View key={item.variantId} style={styles.gridItem}>
                      <PartProductCard
                        product={product}
                        quantity={quantities[product.id] ?? 0}
                        onAdd={() => addItem(product)}
                        onIncrement={increment}
                        onDecrement={decrement}
                        onPress={p =>
                          navigation.navigate('PartDetail', {
                            product: p,
                            categoryTitle: item.categoryName,
                          })
                        }
                      />
                    </View>
                  );
                })}
                {loadingMore && (
                  <View style={styles.footerLoader}>
                    <ActivityIndicator color="#e5383b" />
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </View>

      <FiltersOverlay
        isOpen={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        sections={sections}
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
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
  center: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 40,
    gap: 14,
  },
  footerLoader: { width: '100%', paddingVertical: 12 },
  resultsText: {
    width: '100%',
    fontSize: 13,
    color: '#99a2b6',
  },
  emptyText: {
    fontSize: 14,
    color: '#99a2b6',
    paddingTop: 20,
    paddingHorizontal: 12,
    alignSelf: 'center',
    textAlign: 'center',
  },
  retryBtn: {
    borderWidth: 1,
    borderColor: '#e5383b',
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  retryText: { fontSize: 14, fontWeight: '600', color: '#e5383b' },

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
