import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import type { VehicleBasicInfo } from '../../services/api';
import type { CartItem } from '../../context/CartContext';
import { formatPlateNumber } from '../../utils/formatPlate';
import { getVehicleTitle } from './SelectCarOverlay';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const DEFAULT_CAR_IMAGE =
  require('../../assets/images/default-car.png') as number;

export const formatPrice = (value: number) =>
  `₹${value.toLocaleString('en-IN')}`;

interface PartRowProps {
  item: CartItem;
  onIncrement?: (productId: string) => void;
  onDecrement?: (productId: string) => void;
}

export function PartRow({ item, onIncrement, onDecrement }: PartRowProps) {
  const { product, quantity } = item;
  const image =
    product.image ?? (product.imageUrl ? { uri: product.imageUrl } : undefined);
  return (
    <View style={styles.partRow}>
      <View style={styles.partImageBox}>
        {image && (
          <Image source={image} style={styles.partImage} resizeMode="contain" />
        )}
      </View>
      <View style={styles.partInfo}>
        <Text style={styles.partName}>{product.name}</Text>
        <Text style={styles.partBrand}>Brand: {product.brand}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatPrice(product.price)}</Text>
          <Text style={styles.mrp}>MRP{formatPrice(product.mrp)}</Text>
        </View>
        <Text style={styles.partMeta}>Part Number: {product.sku}</Text>
        {!!product.volume && (
          <Text style={styles.partMeta}>Volume: {product.volume}</Text>
        )}
        {!!product.category && (
          <Text style={styles.partMeta}>Category: {product.category}</Text>
        )}
        {onIncrement && onDecrement ? (
          <View style={styles.stepper}>
            <TouchableOpacity
              style={styles.stepperBtn}
              activeOpacity={0.8}
              onPress={() => onDecrement(product.id)}
            >
              <Text style={styles.stepperBtnText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.stepperQty}>{quantity}</Text>
            <TouchableOpacity
              style={styles.stepperBtn}
              activeOpacity={0.8}
              onPress={() => onIncrement(product.id)}
            >
              <Text style={styles.stepperBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.partMeta}>Quantity: {quantity}</Text>
        )}
      </View>
    </View>
  );
}

interface VehicleDetailsCardProps {
  vehicle: VehicleBasicInfo | null;
  onViewDetails?: () => void;
}

export function VehicleDetailsCard({
  vehicle,
  onViewDetails,
}: VehicleDetailsCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.vehicleHeader}>
        <Text style={styles.cardTitle}>Vehicle Details</Text>
        {vehicle && onViewDetails && (
          <TouchableOpacity onPress={onViewDetails} activeOpacity={0.7}>
            <Text style={styles.viewLink}>View Vehicle Details ›</Text>
          </TouchableOpacity>
        )}
      </View>
      {vehicle ? (
        <View style={styles.vehicleRow}>
          <View style={styles.vehicleImageBox}>
            <Image
              source={
                vehicle.imageUrl ? { uri: vehicle.imageUrl } : DEFAULT_CAR_IMAGE
              }
              style={styles.vehicleImage}
              resizeMode="contain"
            />
          </View>
          <View style={styles.vehicleInfo}>
            <Text style={styles.vehicleName}>{getVehicleTitle(vehicle)}</Text>
            <Text style={styles.vehicleMeta}>
              {[vehicle.variant ?? vehicle.specs, vehicle.year]
                .filter(Boolean)
                .join(' - ')}
            </Text>
            <Text style={styles.vehicleMeta}>
              {formatPlateNumber(vehicle.plateNumber)}
            </Text>
          </View>
        </View>
      ) : (
        <Text style={styles.noVehicle}>No vehicle selected</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  partRow: { flexDirection: 'row', gap: 12, paddingVertical: 8 },
  partImageBox: {
    width: 122,
    height: 112,
    borderRadius: 6,
    backgroundColor: '#f3f3f3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  partImage: { width: '88%', height: '88%' },
  partInfo: { flex: 1, gap: 2 },
  partName: { fontSize: 14, fontWeight: '600', color: '#161a1d' },
  partBrand: { fontSize: 12, color: '#e5383b' },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  price: { fontSize: 15, fontWeight: '700', color: '#161a1d' },
  mrp: { fontSize: 12, color: '#8a8a8e', textDecorationLine: 'line-through' },
  partMeta: { fontSize: 11, color: '#6b7280' },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#e5383b',
    borderRadius: 4,
    backgroundColor: '#ffffff',
    marginTop: 6,
    overflow: 'hidden',
  },
  stepperBtn: {
    width: 30,
    height: 28,
    backgroundColor: '#e5383b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnText: { fontSize: 16, fontWeight: '600', color: '#ffffff' },
  stepperQty: {
    minWidth: 34,
    textAlign: 'center',
    fontSize: 13,
    color: '#e5383b',
  },

  card: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#ffffff',
  },
  cardTitle: { fontSize: 14, fontWeight: '600', color: '#161a1d' },
  vehicleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    marginBottom: 10,
  },
  viewLink: { fontSize: 13, fontWeight: '600', color: '#e5383b' },
  vehicleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  vehicleImageBox: {
    width: 122,
    height: 70,
    borderRadius: 6,
    backgroundColor: '#f3f3f3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleImage: { width: '90%', height: '90%' },
  vehicleInfo: { flex: 1, gap: 2 },
  vehicleName: { fontSize: 14, fontWeight: '600', color: '#161a1d' },
  vehicleMeta: { fontSize: 12, color: '#6b7280' },
  noVehicle: { fontSize: 13, color: '#6b7280' },
});
