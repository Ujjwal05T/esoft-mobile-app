import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  type ImageSourcePropType,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import type { CatalogStackParamList } from '../navigation/CatalogStack';
import { useCart } from '../context/CartContext';
import PartProductCard, {
  type PartProduct,
} from '../components/dashboard/PartProductCard';
import RedHeader from '../components/catalog/RedHeader';
import VehiclePicker from '../components/catalog/VehiclePicker';
import { ChevronDown } from '../components/catalog/icons';
import { getVehicleFullName } from '../components/catalog/SelectCarOverlay';
import { formatPrice } from '../components/catalog/CartParts';
import { useTabBarHeight } from '../components/catalog/useTabBarHeight';
import { useSendInquiry } from '../components/catalog/useSendInquiry';
import AppAlert from '../components/overlays/AppAlert';
import SearchIcon from '../assets/icons/search.svg';
import OilFilterImg from '../assets/images/oil-filter.png';

type Props = NativeStackScreenProps<CatalogStackParamList, 'PartDetail'>;

// Dummy recommendations (to be replaced with API data)
const RECOMMENDED: PartProduct[] = [
  {
    id: 'rec-1',
    sku: 'TY-0000015',
    name: 'Oil Filter Crysta',
    brand: 'Toyota Genuine Parts',
    price: 474,
    mrp: 474,
    image: OilFilterImg,
    volume: '1 Pc',
    category: 'Filters',
  },
  {
    id: 'rec-2',
    sku: 'TY-0000013',
    name: 'Air Filter Crysta',
    brand: 'Toyota Genuine Parts',
    price: 1576,
    mrp: 1578,
    image: OilFilterImg,
    volume: '1 Pc',
    category: 'Filters',
  },
  {
    id: 'rec-3',
    sku: 'TY-0000021',
    name: 'Cabin Filter Crysta',
    brand: 'Toyota Genuine Parts',
    price: 890,
    mrp: 950,
    image: OilFilterImg,
    volume: '1 Pc',
    category: 'Filters',
  },
  {
    id: 'rec-4',
    sku: 'TY-0000034',
    name: 'Fuel Filter Crysta',
    brand: 'Toyota Genuine Parts',
    price: 1240,
    mrp: 1350,
    image: OilFilterImg,
    volume: '1 Pc',
    category: 'Filters',
  },
  {
    id: 'rec-5',
    sku: 'TY-0000047',
    name: 'Spark Plug Set',
    brand: 'Toyota Genuine Parts',
    price: 2150,
    mrp: 2400,
    image: OilFilterImg,
    volume: '1 Pc',
    category: 'Filters',
  },
  {
    id: 'rec-6',
    sku: 'TY-0000052',
    name: 'Engine Coolant 1L',
    brand: 'Toyota Genuine Parts',
    price: 420,
    mrp: 480,
    image: OilFilterImg,
    volume: '1 Pc',
    category: 'Filters',
  },
];

const SCREEN_PADDING = 16;

export default function PartDetailScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<CatalogStackParamList>>();
  const { params } = useRoute<Props['route']>();
  const { product, categoryTitle } = params;
  const { width } = useWindowDimensions();
  const tabBarHeight = useTabBarHeight();
  const { vehicle, quantities, addItem, increment, decrement } = useCart();
  const sendInquiry = useSendInquiry();

  const [qty, setQty] = useState(1);
  const [imageIndex, setImageIndex] = useState(0);
  const [compatOpen, setCompatOpen] = useState(true);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const images: ImageSourcePropType[] = product.images?.length
    ? product.images
    : product.image
    ? [product.image]
    : product.imageUrl
    ? [{ uri: product.imageUrl }]
    : [];
  const carouselWidth = width - SCREEN_PADDING * 2;

  // Products with a badge (e.g. On Order / Out of Stock) go through an inquiry; the rest are ordered.
  const isInquiry = !!product.badge;

  const handleScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setImageIndex(Math.round(e.nativeEvent.contentOffset.x / carouselWidth));
  };

  const handleCta = () => {
    if (isInquiry) {
      const error = sendInquiry([{ product, quantity: qty }]);
      if (error) setAlertMessage(error);
      return;
    }
    addItem(product, qty);
    navigation.navigate('PlaceOrder');
  };

  return (
    <View style={styles.container}>
      <RedHeader
        title={categoryTitle}
        onBack={() => navigation.goBack()}
        right={<SearchIcon width={22} height={22} color="#ffffff" />}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: tabBarHeight + 100 },
        ]}
      >
        <View style={styles.vehicleRow}>
          <Text style={styles.showingLabel}>Showing Parts For</Text>
          <VehiclePicker style={styles.vehiclePicker} />
        </View>

        <View style={styles.carousel}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScrollEnd}
          >
            {images.map((img, i) => (
              <View
                key={i}
                style={{ width: carouselWidth, height: carouselWidth / 1.5 }}
              >
                <Image
                  source={img}
                  style={styles.carouselImage}
                  resizeMode="contain"
                />
              </View>
            ))}
          </ScrollView>
          {!!product.badge && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{product.badge}</Text>
            </View>
          )}
        </View>

        {images.length > 1 && (
          <View style={styles.dots}>
            {images.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === imageIndex && styles.dotActive]}
              />
            ))}
          </View>
        )}

        <Text style={styles.title}>{product.name}</Text>
        <Text style={styles.brand}>{product.brand}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatPrice(product.price)}</Text>
          <Text style={styles.mrp}>MRP{formatPrice(product.mrp)}</Text>
        </View>

        <View style={styles.meta}>
          <Text style={styles.metaText}>Part Number: {product.sku}</Text>
          {!!product.volume && (
            <Text style={styles.metaText}>Volume: {product.volume}</Text>
          )}
          {!!product.category && (
            <Text style={styles.metaText}>Category: {product.category}</Text>
          )}
          {vehicle && (
            <TouchableOpacity
              style={styles.compatRow}
              activeOpacity={0.7}
              onPress={() => setCompatOpen(o => !o)}
            >
              <Text style={styles.compatLabel}>Compatible with : </Text>
              <Text style={styles.compatVehicle} numberOfLines={1}>
                {getVehicleFullName(vehicle)}
              </Text>
              <View style={compatOpen && styles.chevronUp}>
                <ChevronDown color="#e5383b" size={20} />
              </View>
            </TouchableOpacity>
          )}
        </View>

        {!!product.compatibleVehicles?.length && (
          <View style={styles.accordion}>
            <TouchableOpacity
              style={styles.accordionHeader}
              activeOpacity={0.85}
              onPress={() => setCompatOpen(o => !o)}
            >
              <Text style={styles.accordionTitle}>Compatible Vehicles</Text>
              <View style={compatOpen && styles.chevronUp}>
                <ChevronDown color="#ffffff" size={20} />
              </View>
            </TouchableOpacity>
            {compatOpen &&
              product.compatibleVehicles.map(name => (
                <View key={name} style={styles.accordionItem}>
                  <Text style={styles.accordionItemText}>{name}</Text>
                </View>
              ))}
          </View>
        )}

        <View style={styles.recommended}>
          <Text style={styles.recommendedTitle}>
            Recommended with Engine Oil
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recommendedRow}
          >
            {RECOMMENDED.map(rec => (
              <View key={rec.id} style={styles.recommendedItem}>
                <PartProductCard
                  product={rec}
                  quantity={quantities[rec.id] ?? 0}
                  onAdd={() => addItem(rec)}
                  onIncrement={increment}
                  onDecrement={decrement}
                />
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { bottom: tabBarHeight }]}>
        <View style={styles.stepper}>
          <TouchableOpacity
            style={styles.stepperBtn}
            activeOpacity={0.8}
            disabled={qty <= 1}
            onPress={() => setQty(q => Math.max(1, q - 1))}
          >
            <Text style={styles.stepperBtnText}>−</Text>
          </TouchableOpacity>
          <View style={styles.stepperQty}>
            <Text style={styles.stepperQtyText}>{qty}</Text>
          </View>
          <TouchableOpacity
            style={styles.stepperBtn}
            activeOpacity={0.8}
            onPress={() => setQty(q => q + 1)}
          >
            <Text style={styles.stepperBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.cta}
          activeOpacity={0.85}
          onPress={handleCta}
        >
          <View style={styles.thumbs}>
            <View style={[styles.thumb, styles.thumbBack]}>
              {images[0] && (
                <Image
                  source={images[0]}
                  style={styles.thumbImg}
                  resizeMode="contain"
                />
              )}
            </View>
            <View style={[styles.thumb, styles.thumbFront]}>
              {images[0] && (
                <Image
                  source={images[0]}
                  style={styles.thumbImg}
                  resizeMode="contain"
                />
              )}
            </View>
          </View>
          <Text style={styles.ctaText}>
            {isInquiry ? 'Create Inquiry' : 'Place Order'}
          </Text>
          <View style={styles.ctaChevron}>
            <ChevronDown color="#ffffff" size={20} />
          </View>
        </TouchableOpacity>
      </View>

      <AppAlert
        isOpen={!!alertMessage}
        type="info"
        message={alertMessage ?? ''}
        onClose={() => setAlertMessage(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  content: { paddingHorizontal: SCREEN_PADDING, paddingTop: 12 },

  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  showingLabel: { fontSize: 12, color: '#9ca3af' },
  vehiclePicker: { flex: 1 },

  carousel: {
    borderRadius: 12,
    backgroundColor: '#f4f2f3',
    overflow: 'hidden',
    paddingTop: 12,
  },
  carouselImage: { width: '100%', height: '100%' },
  badge: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: 'rgba(229,56,59,0.7)',
    borderWidth: 1,
    borderColor: '#e5383b',
    borderTopLeftRadius: 12,
    borderBottomRightRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 6,
  },
  badgeText: { fontSize: 13, color: '#ffffff' },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#d9d9d9' },
  dotActive: { backgroundColor: '#e5383b' },

  title: { fontSize: 20, fontWeight: '700', color: '#161a1d', marginTop: 16 },
  brand: { fontSize: 14, color: '#e5383b', marginTop: 6 },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  price: { fontSize: 18, fontWeight: '700', color: '#161a1d' },
  mrp: { fontSize: 12, color: '#8a8a8e', textDecorationLine: 'line-through' },

  meta: { marginTop: 12, gap: 8 },
  metaText: { fontSize: 12, color: '#374151' },
  compatRow: { flexDirection: 'row', alignItems: 'center' },
  compatLabel: { fontSize: 12, fontWeight: '700', color: '#161a1d' },
  compatVehicle: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#e5383b',
  },
  chevronUp: { transform: [{ rotate: '180deg' }] },

  accordion: { marginTop: 16 },
  accordionHeader: {
    height: 45,
    borderRadius: 8,
    backgroundColor: '#e5383b',
    paddingHorizontal: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  accordionTitle: { fontSize: 13, color: '#ffffff' },
  accordionItem: {
    marginHorizontal: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
  },
  accordionItemText: { fontSize: 12, color: '#161a1d' },

  recommended: {
    marginTop: 20,
    backgroundColor: '#fbfbe6',
    borderRadius: 10,
    padding: 14,
  },
  recommendedTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#e5383b',
    marginBottom: 12,
  },
  recommendedRow: { gap: 12 },
  recommendedItem: { width: 170 },

  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    paddingHorizontal: SCREEN_PADDING,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5383b',
    borderRadius: 4,
    overflow: 'hidden',
  },
  stepperBtn: {
    width: 44,
    height: 46,
    backgroundColor: '#e5383b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnText: { fontSize: 20, color: '#ffffff', fontWeight: '600' },
  stepperQty: {
    width: 46,
    height: 46,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperQtyText: { fontSize: 16, color: '#e5383b' },

  cta: {
    flex: 1,
    height: 54,
    borderRadius: 8,
    backgroundColor: '#e5383b',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 14,
  },
  thumbs: { width: 62, height: 46 },
  thumb: {
    position: 'absolute',
    width: 42,
    height: 46,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbBack: { left: 20, opacity: 0.85 },
  thumbFront: { left: 0 },
  thumbImg: { width: 32, height: 38 },
  ctaText: { flex: 1, fontSize: 15, fontWeight: '700', color: '#ffffff' },
  ctaChevron: { transform: [{ rotate: '-90deg' }] },
});
