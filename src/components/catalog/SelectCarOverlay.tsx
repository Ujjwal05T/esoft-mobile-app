import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  FlatList,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { CloseCircleIcon } from './icons';
import { getCurrentVehicles, type VehicleBasicInfo } from '../../services/api';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const DEFAULT_CAR_IMAGE =
  require('../../assets/images/default-car.png') as number;

export const getVehicleTitle = (v: VehicleBasicInfo) =>
  [v.brand, v.model].filter(Boolean).join(' ') || v.plateNumber;

export const getVehicleFullName = (v: VehicleBasicInfo) =>
  [v.brand, v.model, v.variant ?? v.specs, v.year].filter(Boolean).join(' ') ||
  v.plateNumber;

const getVehicleSubtitle = (v: VehicleBasicInfo) =>
  [v.variant ?? v.specs, v.year].filter(Boolean).join(' - ');

interface SelectCarOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (vehicle: VehicleBasicInfo) => void;
  onAddCar?: () => void;
}

const SearchGlyph = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Circle cx={11} cy={11} r={7} stroke="#161a1d" strokeWidth={2} />
    <Path
      d="M20 20L16.5 16.5"
      stroke="#161a1d"
      strokeWidth={2}
      strokeLinecap="round"
    />
  </Svg>
);

const PlusCircle = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={10} stroke="#e5383b" strokeWidth={2} />
    <Path
      d="M12 8V16M8 12H16"
      stroke="#e5383b"
      strokeWidth={2}
      strokeLinecap="round"
    />
  </Svg>
);

export default function SelectCarOverlay({
  isOpen,
  onClose,
  onSelect,
  onAddCar,
}: SelectCarOverlayProps) {
  const [vehicles, setVehicles] = useState<VehicleBasicInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getCurrentVehicles();
        if (cancelled) return;
        if (res.success && res.data) {
          // A vehicle can appear in more than one active visit; keep one card per vehicle.
          const seen = new Set<number>();
          const unique: VehicleBasicInfo[] = [];
          res.data.visits.forEach(visit => {
            const v = visit.vehicle;
            if (v && !seen.has(v.id)) {
              seen.add(v.id);
              unique.push(v);
            }
          });
          setVehicles(unique);
        } else {
          setError(res.error ?? 'Failed to load vehicles.');
        }
      } catch {
        if (!cancelled) setError('Network error. Please try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/\s+/g, '');
    if (!q) return vehicles;
    return vehicles.filter(v =>
      [v.plateNumber, v.brand, v.model, v.variant]
        .filter(Boolean)
        .join('')
        .toLowerCase()
        .replace(/\s+/g, '')
        .includes(q),
    );
  }, [vehicles, query]);

  // Pad odd-length lists with a spacer so the last card keeps half-width.
  const gridData: (VehicleBasicInfo | null)[] =
    filtered.length % 2 === 1 ? [...filtered, null] : filtered;

  const renderItem = ({ item }: { item: VehicleBasicInfo | null }) =>
    item === null ? (
      <View style={styles.spacer} />
    ) : (
      <View style={styles.card}>
        <View style={styles.imageBox}>
          <Image
            source={item.imageUrl ? { uri: item.imageUrl } : DEFAULT_CAR_IMAGE}
            style={styles.image}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.carName} numberOfLines={1}>
          {getVehicleTitle(item)}
        </Text>
        <Text style={styles.carSpec} numberOfLines={1}>
          {getVehicleSubtitle(item) || item.plateNumber}
        </Text>
        <TouchableOpacity
          style={styles.selectBtn}
          activeOpacity={0.8}
          onPress={() => onSelect(item)}
        >
          <Text style={styles.selectBtnText}>Select Car</Text>
        </TouchableOpacity>
      </View>
    );

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.sheet}>
          <View style={styles.dragHandle} />

          <View style={styles.headerRow}>
            <Text style={styles.title}>Select Car</Text>
            {onAddCar && (
              <TouchableOpacity
                style={styles.addBtn}
                activeOpacity={0.8}
                onPress={onAddCar}
              >
                <PlusCircle />
                <Text style={styles.addBtnText}>Add Car</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onClose} activeOpacity={0.7} hitSlop={8}>
              <CloseCircleIcon />
            </TouchableOpacity>
          </View>

          <View style={styles.searchBox}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Vehicle Number"
              placeholderTextColor="#6b7280"
              autoCapitalize="characters"
              style={styles.searchInput}
            />
            <SearchGlyph />
          </View>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color="#e5383b" />
            </View>
          ) : error ? (
            <View style={styles.center}>
              <Text style={styles.emptyText}>{error}</Text>
            </View>
          ) : (
            <FlatList
              data={gridData}
              keyExtractor={(v, i) => (v ? String(v.id) : `spacer-${i}`)}
              renderItem={renderItem}
              numColumns={2}
              columnWrapperStyle={styles.column}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <View style={styles.center}>
                  <Text style={styles.emptyText}>No vehicles found</Text>
                </View>
              }
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    height: '82%',
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
    paddingHorizontal: 12,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#d9d9d9',
    alignSelf: 'center',
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  title: { flex: 1, fontSize: 20, fontWeight: '700', color: '#161a1d' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#e5383b',
    borderRadius: 4,
    paddingHorizontal: 10,
    height: 30,
  },
  addBtnText: { fontSize: 13, color: '#e5383b' },
  searchBox: {
    height: 46,
    borderWidth: 1,
    borderColor: '#dadada',
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#161a1d', padding: 0 },
  listContent: { paddingBottom: 24, rowGap: 10 },
  column: { gap: 10 },
  spacer: { flex: 1 },
  card: { flex: 1, backgroundColor: '#f5f5f5', borderRadius: 10, padding: 8 },
  imageBox: {
    width: '100%',
    aspectRatio: 1.15,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  image: { width: '90%', height: '90%' },
  carName: { fontSize: 14, fontWeight: '500', color: '#161a1d' },
  carSpec: { fontSize: 12, color: '#4b5563', marginTop: 2, marginBottom: 8 },
  selectBtn: {
    height: 30,
    borderWidth: 1,
    borderColor: '#e5383b',
    borderRadius: 4,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectBtnText: { fontSize: 13, color: '#e5383b' },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: { fontSize: 14, color: '#99a2b6' },
});
