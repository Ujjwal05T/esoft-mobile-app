import React, { useEffect, useState } from 'react';
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
import ImagePlaceholder from '../components/catalog/ImagePlaceholder';
import PillButton from '../components/catalog/PillButton';
import { getVehicleFullName } from '../components/catalog/SelectCarOverlay';
import { formatPrice } from '../components/catalog/CartParts';
import { useTabBarHeight } from '../components/catalog/useTabBarHeight';
import { useInquiryWithVehicle } from '../components/catalog/useInquiryWithVehicle';
import AppAlert from '../components/overlays/AppAlert';
import SearchIcon from '../assets/icons/search.svg';
import {
  describeCompatibleVehicle,
  toPartProduct,
} from '../components/catalog/catalogMapping';
import {
  getCatalogProduct,
  getCatalogProducts,
  type CatalogItemDetail,
  type CatalogItemSummary,
} from '../services/api';

type Props = NativeStackScreenProps<CatalogStackParamList, 'PartDetail'>;

const SCREEN_PADDING = 16;

export default function PartDetailScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<CatalogStackParamList>>();
  const { params } = useRoute<Props['route']>();
  const { product: initialProduct, categoryTitle } = params;
  const { width } = useWindowDimensions();
  const tabBarHeight = useTabBarHeight();
  const { vehicle, quantities, addItem, increment, decrement } = useCart();
  const { send: sendInquiry, element: inquiryFlow } = useInquiryWithVehicle();

  // The sellable item on screen. Tapping a sibling variation switches it without leaving the screen.
  const [activeId, setActiveId] = useState(Number(initialProduct.id));
  const [detail, setDetail] = useState<CatalogItemDetail | null>(null);
  const [related, setRelated] = useState<CatalogItemSummary[]>([]);

  // Full detail (images, specifications, compatibility, siblings) from the catalog API
  useEffect(() => {
    let cancelled = false;
    getCatalogProduct(activeId, vehicle?.id).then(res => {
      if (cancelled || !res.success || !res.data) return;
      setDetail(res.data);
      setImageIndex(0);
    });
    return () => {
      cancelled = true;
    };
  }, [activeId, vehicle?.id]);

  // More parts from the same category (filtered to the selected vehicle)
  const detailProductId = detail?.productId;
  const detailCategoryId = detail?.categoryId;
  useEffect(() => {
    if (!detailProductId || !detailCategoryId) return;
    let cancelled = false;
    getCatalogProducts({
      categoryId: detailCategoryId,
      vehicleId: vehicle?.id,
      excludeProductId: detailProductId,
      pageSize: 7,
    }).then(res => {
      if (!cancelled && res.success && res.data) setRelated(res.data.items);
    });
    return () => {
      cancelled = true;
    };
  }, [detailProductId, detailCategoryId, vehicle?.id]);

  // Until the detail arrives (or while switching), show what the card already knew
  const ready = detail && detail.variantId === activeId ? detail : null;
  const product: PartProduct = ready
    ? {
        id: String(ready.variantId),
        sku: ready.sku,
        name: ready.name,
        brand: ready.brandName,
        price: ready.price,
        mrp: ready.mrp && ready.mrp > ready.price ? ready.mrp : ready.price,
        imageUrl: ready.images[0],
        badge: ready.isOnOrder ? 'On Order' : undefined,
        outOfStock: ready.isOnOrder,
        volume: ready.attrValue ?? undefined,
        category: ready.categoryName,
      }
    : initialProduct;

  const compatList: string[] = ready
    ? ready.isUniversal
      ? ['Fits all vehicles']
      : ready.compatibleVehicles.map(describeCompatibleVehicle)
    : [];

  const cartQty = quantities[product.id] ?? 0;
  const [imageIndex, setImageIndex] = useState(0);
  const [compatOpen, setCompatOpen] = useState(true);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const images: ImageSourcePropType[] = ready?.images.length
    ? ready.images.map(uri => ({ uri }))
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

  const handleAddToCart = () => addItem(product, 1);

  const handleCta = () => {
    if (isInquiry) {
      sendInquiry([{ product, quantity: cartQty }]);
      return;
    }
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
            {images.length === 0 && (
              <ImagePlaceholder
                style={{ width: carouselWidth, height: carouselWidth / 1.5 }}
              />
            )}
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
          {product.mrp > product.price && (
            <Text style={styles.mrp}>MRP{formatPrice(product.mrp)}</Text>
          )}
        </View>

        {!!ready && ready.siblings.length > 1 && (
          <View style={styles.variants}>
            <Text style={styles.variantsLabel}>Also available in</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.variantsRow}
            >
              {ready.siblings.map(sibling => {
                const active = sibling.variantId === activeId;
                return (
                  <TouchableOpacity
                    key={sibling.variantId}
                    activeOpacity={0.8}
                    onPress={() => setActiveId(sibling.variantId)}
                    style={[
                      styles.variantChip,
                      active && styles.variantChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.variantChipLabel,
                        active && styles.variantChipLabelActive,
                      ]}
                    >
                      {sibling.label}
                    </Text>
                    <Text
                      style={[
                        styles.variantChipPrice,
                        active && styles.variantChipLabelActive,
                      ]}
                    >
                      {formatPrice(sibling.price)}
                      {sibling.isOnOrder ? ' · On Order' : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

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
              <Text style={styles.compatLabel}>
                {ready?.fitsVehicle === false
                  ? 'Not listed for : '
                  : ready?.verifyFit
                  ? 'Verify fit with : '
                  : 'Compatible with : '}
              </Text>
              <Text style={styles.compatVehicle} numberOfLines={1}>
                {getVehicleFullName(vehicle)}
              </Text>
              <View style={compatOpen && styles.chevronUp}>
                <ChevronDown color="#e5383b" size={20} />
              </View>
            </TouchableOpacity>
          )}
        </View>

        {!!ready?.description && (
          <Text style={styles.description}>{ready.description}</Text>
        )}

        {!!ready && ready.specs.length > 0 && (
          <View style={styles.specs}>
            {ready.specs.map(spec => (
              <View key={spec.key} style={styles.specRow}>
                <Text style={styles.specKey}>{spec.key}</Text>
                <Text style={styles.specValue}>{spec.value}</Text>
              </View>
            ))}
          </View>
        )}

        {compatList.length > 0 && (
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
              compatList.map(name => (
                <View key={name} style={styles.accordionItem}>
                  <Text style={styles.accordionItemText}>{name}</Text>
                </View>
              ))}
          </View>
        )}

        {related.length > 0 && (
          <View style={styles.recommended}>
            <Text style={styles.recommendedTitle}>
              More in {ready?.categoryName ?? categoryTitle}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recommendedRow}
            >
              {related.map(item => {
                const rec = toPartProduct(item);
                return (
                  <View key={rec.id} style={styles.recommendedItem}>
                    <PartProductCard
                      product={rec}
                      quantity={quantities[rec.id] ?? 0}
                      onAdd={() => addItem(rec)}
                      onIncrement={increment}
                      onDecrement={decrement}
                      onPress={() => {
                        setRelated([]);
                        setActiveId(item.variantId);
                      }}
                    />
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      <View style={[styles.bottomBar, { bottom: tabBarHeight }]}>
        {cartQty <= 0 ? (
          <PillButton
            style={styles.addToCartBtn}
            icon={
              images[0] ? (
                <Image
                  source={images[0]}
                  style={styles.ctaIconImg}
                  resizeMode="contain"
                />
              ) : undefined
            }
            label="Add to Cart"
            subtitle={formatPrice(product.price)}
            onPress={handleAddToCart}
          />
        ) : (
          <>
            <View style={styles.stepper}>
              <TouchableOpacity
                style={styles.stepperBtn}
                activeOpacity={0.8}
                onPress={() => decrement(product.id)}
              >
                <Text style={styles.stepperBtnText}>−</Text>
              </TouchableOpacity>
              <View style={styles.stepperQty}>
                <Text style={styles.stepperQtyText}>{cartQty}</Text>
              </View>
              <TouchableOpacity
                style={styles.stepperBtn}
                activeOpacity={0.8}
                onPress={() => increment(product.id)}
              >
                <Text style={styles.stepperBtnText}>+</Text>
              </TouchableOpacity>
            </View>

            <PillButton
              style={styles.ctaCompact}
              icon={
                images[0] ? (
                  <Image
                    source={images[0]}
                    style={styles.ctaIconImg}
                    resizeMode="contain"
                  />
                ) : undefined
              }
              label={isInquiry ? 'Create Inquiry' : 'Place Order'}
              subtitle={formatPrice(product.price * cartQty)}
              onPress={handleCta}
            />
          </>
        )}
      </View>

      {inquiryFlow}

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

  variants: { marginTop: 14 },
  variantsLabel: { fontSize: 12, color: '#9ca3af', marginBottom: 8 },
  variantsRow: { gap: 8 },
  variantChip: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
  },
  variantChipActive: { borderColor: '#e5383b', backgroundColor: '#e5383b' },
  variantChipLabel: { fontSize: 13, fontWeight: '600', color: '#161a1d' },
  variantChipLabelActive: { color: '#ffffff' },
  variantChipPrice: { fontSize: 11, color: '#6b7280', marginTop: 2 },

  description: {
    marginTop: 14,
    fontSize: 13,
    lineHeight: 19,
    color: '#374151',
  },
  specs: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    overflow: 'hidden',
  },
  specRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  specKey: { flex: 1, fontSize: 12, color: '#6b7280' },
  specValue: { flex: 1.3, fontSize: 12, color: '#161a1d', fontWeight: '600' },

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
    height: 35,
    width: 100,
  },
  stepperBtn: {
    width: 30,
    height: 46,
    backgroundColor: '#e5383b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnText: { fontSize: 20, color: '#ffffff', fontWeight: '600' },
  stepperQty: {
    width: 38,
    height: 46,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperQtyText: { fontSize: 14, color: '#e5383b' },

  ctaCompact: {
    width: '50%',
    marginLeft: 'auto',
    height: 46,
    borderRadius: 23,
  },
  addToCartBtn: {
    width: '50%',
    marginLeft: 'auto',
    height: 46,
    borderRadius: 23,
  },
  ctaIconImg: { width: 22, height: 26 },
});
