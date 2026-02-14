import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {getVehicles, type VehicleResponse} from '../../services/api';
import VehicleCard from './VehicleCard';

interface DisplayVehicle {
  id: string;
  plateNumber: string;
  year?: number;
  brand?: string;
  model?: string;
  variant?: string;
  specs?: string;
  status: 'Active' | 'Inactive' | 'Requested';
}

export default function JobsCard() {
  const [vehicles, setVehicles] = useState<DisplayVehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchVehicles() {
      try {
        setIsLoading(true);
        const result = await getVehicles();
        if (result.success && result.data) {
          const all: DisplayVehicle[] = result.data.vehicles.map(
            (v: VehicleResponse) => ({
              id: String(v.id),
              plateNumber: v.plateNumber,
              year: v.year || undefined,
              brand: v.brand || undefined,
              model: v.model || undefined,
              variant: v.variant || undefined,
              specs: v.specs || v.variant || undefined,
              status: v.status as 'Active' | 'Inactive' | 'Requested',
            }),
          );
          setVehicles(all);
        }
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    }
    fetchVehicles();
  }, []);

  const jobCount = vehicles.length;

  return (
    <LinearGradient
      colors={['#e5383b', '#8C2424']}
      start={{x: 0.8, y: 0}}
      end={{x: 1, y: 0.9}}
      style={styles.card}>
      {/* Large Number Background */}
      <Text style={styles.bigNumber}>{jobCount}</Text>

      {/* Text Label */}
      <Text style={styles.label}>Jobs{'\n'}Card Open</Text>

      {/* Vehicle Cards Horizontal Scroll */}
      <View style={styles.scrollSection}>
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color="#ffffff" />
          </View>
        ) : vehicles.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            snapToInterval={370}
            decelerationRate="fast">
            {vehicles.map(v => (
              <View key={v.id} style={styles.cardItem}>
                <VehicleCard
                  plateNumber={v.plateNumber}
                  year={v.year}
                  make={v.brand || 'Unknown'}
                  model={v.model || 'Unknown'}
                  specs={v.specs || v.variant || ''}
                  variant="default"
                />
              </View>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.center}>
            <Text style={styles.emptyText}>No requested vehicles</Text>
          </View>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#e5383b',
    height: 404,
    borderRadius: 17,
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
  },
  bigNumber: {
    position: 'absolute',
    top: 37,
    left: 0,
    right: 210,
    textAlign: 'center',
    fontSize: 180,
    lineHeight: 135,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: -1,
  },
  label: {
    position: 'absolute',
    top: 77,
    left: 0,
    right: 0,
    fontSize: 28,
    fontWeight: '900',
    color: '#f0f0f0',
    textAlign: 'center',
    letterSpacing: -1,
    lineHeight: 36,
  },
  scrollSection: {
    position: 'absolute',
    left: 16,
    right: 0,
    top: 158,
    bottom: 0,
  },
  scrollContent: {
    gap: 12,
    paddingRight: 16,
    paddingBottom: 4,
  },
  cardItem: {
    width: 350,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#ffffff',
    fontSize: 14,
  },
});
