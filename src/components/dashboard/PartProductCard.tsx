import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ImageSourcePropType,
} from 'react-native';

export interface PartProduct {
  id: string;
  sku: string;
  name: string;
  brand: string;
  price: number;
  mrp: number;
  imageUrl?: string;
  image?: ImageSourcePropType;
  badge?: string;
  volume?: string;
  category?: string;
  outOfStock?: boolean;
  images?: ImageSourcePropType[];
  compatibleVehicles?: string[];
}

interface PartProductCardProps {
  product: PartProduct;
  quantity?: number;
  onAdd?: (id: string) => void;
  onIncrement?: (id: string) => void;
  onDecrement?: (id: string) => void;
  onPress?: (product: PartProduct) => void;
}

const formatPrice = (value: number) => `₹${value.toLocaleString('en-IN')}`;

export default function PartProductCard({
  product,
  quantity = 0,
  onAdd,
  onIncrement,
  onDecrement,
  onPress,
}: PartProductCardProps) {
  const imageSource: ImageSourcePropType | undefined = product.image
    ? product.image
    : product.imageUrl
    ? { uri: product.imageUrl }
    : undefined;

  return (
    <TouchableOpacity
      activeOpacity={0.95}
      disabled={!onPress}
      onPress={() => onPress?.(product)}
      style={styles.card}
    >
      {!!product.badge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{product.badge}</Text>
        </View>
      )}
      <View style={styles.imageWrap}>
        <View style={styles.imageBox}>
          {imageSource && (
            <Image
              source={imageSource}
              style={styles.image}
              resizeMode="contain"
            />
          )}
        </View>

        {quantity > 0 ? (
          <View style={styles.stepper}>
            <TouchableOpacity
              style={[styles.stepperBtn, styles.stepperBtnLeft]}
              activeOpacity={0.8}
              onPress={() => onDecrement?.(product.id)}
            >
              <Text style={styles.stepperBtnText}>-</Text>
            </TouchableOpacity>
            <View style={styles.stepperQtyBox}>
              <Text style={styles.stepperQtyText}>{quantity}</Text>
            </View>
            <TouchableOpacity
              style={[styles.stepperBtn, styles.stepperBtnRight]}
              activeOpacity={0.8}
              onPress={() => onIncrement?.(product.id)}
            >
              <Text style={styles.stepperBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.addBtn}
            activeOpacity={0.8}
            onPress={() => onAdd?.(product.id)}
          >
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.sku} numberOfLines={1}>
          {product.sku}
        </Text>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={styles.brand} numberOfLines={1}>
          {product.brand}
        </Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatPrice(product.price)}</Text>
          <Text style={styles.mrp}>MRP{formatPrice(product.mrp)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 8,
  },
  badge: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 1,
    backgroundColor: 'rgba(229,56,59,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderTopLeftRadius: 10,
    borderBottomRightRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#ffffff',
  },
  imageWrap: {
    position: 'relative',
  },
  imageBox: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '88%',
    height: '88%',
  },
  info: {
    marginTop: 8,
    gap: 2,
  },
  sku: {
    fontSize: 12,
    color: '#8a8a8e',
  },
  name: {
    fontSize: 15,
    color: '#000000',
  },
  brand: {
    fontSize: 12,
    color: '#8a8a8e',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  price: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
  },
  mrp: {
    fontSize: 12,
    color: '#8a8a8e',
    textDecorationLine: 'line-through',
  },
  addBtn: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 68,
    height: 25,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#e5383b',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 2,
  },
  addBtnText: {
    fontSize: 11,
    color: '#e5383b',
  },
  stepper: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 68,
    height: 25,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#e5383b',
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 2,
  },
  stepperBtn: {
    width: 22,
    height: 25,
    backgroundColor: '#e5383b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnLeft: {
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
  },
  stepperBtnRight: {
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
  stepperBtnText: {
    fontSize: 13,
    color: '#ffffff',
    fontWeight: '600',
  },
  stepperQtyBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperQtyText: {
    fontSize: 11,
    color: '#e5383b',
  },
});
