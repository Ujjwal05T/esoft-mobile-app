import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Svg, {Path} from 'react-native-svg';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/RootNavigator';
import PartProductCard, {PartProduct} from '../components/dashboard/PartProductCard';

import SearchIcon from '../assets/icons/search.svg';
import HomeIcon from '../assets/icons/home.svg';
import VehicleIcon from '../assets/icons/vehicle.svg';
import OrderIcon from '../assets/icons/order.svg';
import InquiryIcon from '../assets/icons/inquiry.svg';
import SparkleIcon from '../assets/icons/plus.svg';
import OilIcon from '../assets/icons/oil-lubricant.svg';
import ShockIcon from '../assets/icons/shock-absorber.svg';
import BodyIcon from '../assets/icons/body-parts.svg';
import LightingIcon from '../assets/icons/lighting.svg';
import BrakeIcon from '../assets/icons/brake-system.svg';
import ClutchIcon from '../assets/icons/clutch-system.svg';
import OilFilterImg from '../assets/images/oil-filter.png';

type Props = NativeStackScreenProps<RootStackParamList, 'RunningParts'>;

type SvgIcon = React.FC<{width?: number; height?: number; color?: string}>;

const BackIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 12H5M5 12L12 19M5 12L12 5"
      stroke="#161a1d"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ChevronRight = ({color = '#b1a7a6'}: {color?: string}) => (
  <Svg width={12} height={12} viewBox="0 0 12 12" fill="none">
    <Path
      d="M4.5 2.5L8 6L4.5 9.5"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

interface Category {
  key: string;
  label: string;
  Icon: SvgIcon;
}


const CATEGORIES: Category[] = [
  {key: 'oil', label: 'Oil & Lubricant', Icon: OilIcon as unknown as SvgIcon},
  {key: 'shock', label: 'Shock Absorbers', Icon: ShockIcon as unknown as SvgIcon},
  {key: 'body', label: 'Body Parts', Icon: BodyIcon as unknown as SvgIcon},
  {key: 'lighting', label: 'Lighting', Icon: LightingIcon as unknown as SvgIcon},
  {key: 'brake', label: 'Brake Systems', Icon: BrakeIcon as unknown as SvgIcon},
  {key: 'clutch', label: 'Clutch System', Icon: ClutchIcon as unknown as SvgIcon},
];

const MOCK_PRODUCTS: PartProduct[] = [
  {id: '1', sku: 'Val-0000001', name: 'All Climate Advanced 5W30 5L', brand: 'Valvoline', price: 1600, mrp: 2100, image: OilFilterImg},
  {id: '2', sku: 'Val-0000002', name: 'All Climate Dsl/Ptl 15W40', brand: 'Valvoline', price: 1050, mrp: 1600, image: OilFilterImg},
  {id: '3', sku: 'Val-0000003', name: 'All Climate Modern 5W30', brand: 'Valvoline', price: 1250, mrp: 1800, image: OilFilterImg},
  {id: '4', sku: 'Val-0000004', name: 'Synpower 5W40', brand: 'Valvoline', price: 1900, mrp: 2500, image: OilFilterImg},
  {id: '5', sku: 'TM-0000001', name: 'CI4+ 15W40 Diesel Engine Oil', brand: 'TATA Motors Genuine Oil', price: 900, mrp: 1100, image: OilFilterImg},
  {id: '6', sku: 'TY-0000001', name: '5W30 Toyota Value Semi Synthetic Engine Oil', brand: 'Toyota Value', price: 2190, mrp: 2400, image: OilFilterImg},
];

const FILTER_CHIPS = ['Brands', 'Oil Grade', 'Sort'];
const BAR_HEIGHT_PADDING = 24;

export default function RunningPartsScreen({navigation}: Props) {
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState('oil');
  const [quantities, setQuantities] = useState<Record<string, number>>({'1': 1});
  const [itemLayouts, setItemLayouts] = useState<Record<string, {y: number; height: number}>>({});
  const activeBarLayout = itemLayouts[selectedCategory];

  const handleAdd = (id: string) => setQuantities(q => ({...q, [id]: 1}));
  const handleIncrement = (id: string) =>
    setQuantities(q => ({...q, [id]: (q[id] ?? 0) + 1}));
  const handleDecrement = (id: string) =>
    setQuantities(q => {
      const next = (q[id] ?? 0) - 1;
      const copy = {...q};
      if (next <= 0) {
        delete copy[id];
      } else {
        copy[id] = next;
      }
      return copy;
    });

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.topSafeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            style={styles.headerBtn}>
            <BackIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Running Parts</Text>
          <TouchableOpacity activeOpacity={0.7} style={styles.headerBtn}>
            <SearchIcon width={22} height={22} color="#161a1d" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <View style={styles.body}>
        <View style={styles.sidebarWrap}>
          <ScrollView
            style={styles.sidebar}
            contentContainerStyle={styles.sidebarContent}
            showsVerticalScrollIndicator={false}>
            {CATEGORIES.map(cat => {
              const active = selectedCategory === cat.key;
              const Icon = cat.Icon;
              return (
                <TouchableOpacity
                  key={cat.key}
                  style={styles.categoryItem}
                  activeOpacity={0.8}
                  onPress={() => setSelectedCategory(cat.key)}
                  onLayout={e => {
                    const {y, height} = e.nativeEvent.layout;
                    setItemLayouts(prev => ({...prev, [cat.key]: {y, height}}));
                  }}>
                  <View
                    style={[
                      styles.categoryIconCircle,
                      active && styles.categoryIconCircleActive,
                    ]}>
                    <Icon width={46} height={46} color={active ? '#ffffff' : '#e5383b'} />
                  </View>
                  <Text
                    style={[styles.categoryLabel, active && styles.categoryLabelActive]}
                    numberOfLines={2}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          {activeBarLayout && (
            <View
              style={[
                styles.categoryActiveBar,
                {
                  top: activeBarLayout.y - BAR_HEIGHT_PADDING / 2,
                  height: activeBarLayout.height + BAR_HEIGHT_PADDING,
                },
              ]}
            />
          )}
        </View>

        <ScrollView
          style={styles.gridScroll}
          contentContainerStyle={[styles.grid, {paddingBottom: insets.bottom + 150}]}
          showsVerticalScrollIndicator={false}>
        <View style={styles.filtersWrap}>
          <TouchableOpacity style={styles.selectCarChip} activeOpacity={0.7}>
            <Text style={styles.chipTextMuted}>Select Your Car</Text>
            <ChevronRight />
          </TouchableOpacity>
          <View style={styles.chipsRow}>
            {FILTER_CHIPS.map(label => (
              <TouchableOpacity key={label} style={styles.chip} activeOpacity={0.7}>
                <Text style={styles.chipTextMuted}>{label}</Text>
                <ChevronRight />
              </TouchableOpacity>
            ))}
          </View>
        </View>
          {selectedCategory === 'oil' ? (
            MOCK_PRODUCTS.map(product => (
              <PartProductCard
                key={product.id}
                product={product}
                quantity={quantities[product.id] ?? 0}
                onAdd={handleAdd}
                onIncrement={handleIncrement}
                onDecrement={handleDecrement}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No products in this category yet</Text>
            </View>
          )}
        </ScrollView>
      </View>

      <LinearGradient
        colors={['rgba(255,255,255,0)', '#ffffff']}
        pointerEvents="none"
        style={[styles.fade, {bottom: insets.bottom + 76}]}
      />

      <TouchableOpacity
        style={[styles.placeOrderBtn, {bottom: insets.bottom + 90}]}
        activeOpacity={0.85}>
        <Text style={styles.placeOrderText}>Place Order</Text>
        <ChevronRight color="#ffffff" />
      </TouchableOpacity>

      <View style={[styles.navBar, {paddingBottom: insets.bottom + 6}]}>
        <View style={styles.navTabsRow}>
          <TouchableOpacity style={styles.navTab} activeOpacity={0.8}>
            <HomeIcon width={18} height={18} color="#2b2b2b" />
            <Text style={styles.navTabLabel}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navTab} activeOpacity={0.8}>
            <VehicleIcon width={18} height={18} color="#2b2b2b" />
            <Text style={styles.navTabLabel}>Vehicle</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.navTab, styles.navTabActive]} activeOpacity={0.8}>
            <OrderIcon width={18} height={18} color="#ffffff" />
            <Text style={[styles.navTabLabel, styles.navTabLabelActive]}>Order</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navTab} activeOpacity={0.8}>
            <InquiryIcon width={18} height={18} color="#2b2b2b" />
            <Text style={styles.navTabLabel}>Inquiry</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.fab} activeOpacity={0.8}>
          <SparkleIcon width={22} height={22} color="#e5383b" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#ffffff'},

  topSafeArea: {backgroundColor: '#ffffff'},
  header: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  headerBtn: {width: 32, alignItems: 'center', justifyContent: 'center'},
  headerTitle: {
    flex: 1,
    marginLeft: 8,
    fontSize: 22,
    fontWeight: '600',
    color: '#e5383b',
  },

  filtersWrap: {paddingHorizontal: 0, paddingBottom: 6, gap: 10},
  selectCarChip: {
    height: 38,
    borderWidth: 1,
    borderColor: '#dadada',
    borderRadius: 4,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chipsRow: {flexDirection: 'row', gap: 10},
  chip: {
    height: 38,
    borderWidth: 1,
    borderColor: '#dadada',
    borderRadius: 4,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  chipTextMuted: {fontSize: 13, fontWeight: '500', color: '#b1a7a6'},

  body: {flex: 1, flexDirection: 'row'},

  sidebarWrap: {width: 95, backgroundColor: '#f5f3f4', position: 'relative'},
  sidebar: {flex: 1},
  sidebarContent: {paddingVertical: 22, paddingHorizontal: 4, gap: 16},
  categoryItem: {width: 84, alignItems: 'center', gap: 8},
  categoryActiveBar: {
    position: 'absolute',
    left: '100%',
    width: 5,
    backgroundColor: '#e5383b',
    borderTopRightRadius: 5,
    borderBottomRightRadius: 5,
  },
  categoryIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIconCircleActive: {backgroundColor: '#e5383b'},
  categoryLabel: {
    width: '100%',
    fontSize: 12,
    color: '#b1a7a6',
    textAlign: 'center',
    lineHeight: 15,
  },
  categoryLabelActive: {color: '#e5383b', fontWeight: '600'},

  gridScroll: {flex: 1},
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
    padding: 16,
    flexGrow: 1,
    
  },
  emptyState: {flex: 1, alignItems: 'center', paddingTop: 6, width: '100%'},
  emptyStateText: {fontSize: 14, color: '#99a2b6'},

  fade: {position: 'absolute', left: 0, right: 0, height: 101},

  placeOrderBtn: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: '#e5383b',
    height: 58,
    paddingHorizontal: 28,
    borderRadius: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#e5383b',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  placeOrderText: {fontSize: 17, fontWeight: '600', color: '#ffffff', letterSpacing: -0.41},

  navBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#e8ebf2',
    paddingHorizontal: 16,
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navTabsRow: {flex: 1, flexDirection: 'row', gap: 6},
  navTab: {
    flex: 1,
    height: 70,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  navTabActive: {backgroundColor: '#e5383b'},
  navTabLabel: {fontSize: 12, color: '#2b2b2b', textAlign: 'center'},
  navTabLabelActive: {color: '#ffffff'},
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#e5383b',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
});
