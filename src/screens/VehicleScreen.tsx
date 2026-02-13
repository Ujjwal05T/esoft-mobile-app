import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

// Import SVG icons
import SearchIcon from '../assets/icons/search.svg';
import VehicleIcon from '../assets/icons/vehicle.svg';
import ChevronRightIcon from '../assets/icons/chevron-right.svg';

interface Vehicle {
  id: string;
  name: string;
  number: string;
  type: string;
  status: 'active' | 'maintenance' | 'inactive';
}

const dummyVehicles: Vehicle[] = [
  {id: '1', name: 'Toyota Camry', number: 'ABC 1234', type: 'Sedan', status: 'active'},
  {id: '2', name: 'Honda Civic', number: 'XYZ 5678', type: 'Sedan', status: 'maintenance'},
  {id: '3', name: 'Ford F-150', number: 'DEF 9012', type: 'Truck', status: 'active'},
  {id: '4', name: 'BMW X5', number: 'GHI 3456', type: 'SUV', status: 'inactive'},
  {id: '5', name: 'Mercedes C-Class', number: 'JKL 7890', type: 'Sedan', status: 'active'},
];

const VehicleScreen: React.FC = () => {
  const getStatusColor = (status: Vehicle['status']) => {
    switch (status) {
      case 'active':
        return '#10b981';
      case 'maintenance':
        return '#f59e0b';
      case 'inactive':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f7fa" />
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Vehicles</Text>
        <TouchableOpacity style={styles.addButton}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <SearchIcon width={18} height={18} fill="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search vehicles..."
            placeholderTextColor="#9ca3af"
          />
        </View>
      </View>

      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}>
        {['All', 'Active', 'Maintenance', 'Inactive'].map((filter, index) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterChip,
              index === 0 && styles.filterChipActive,
            ]}>
            <Text
              style={[
                styles.filterChipText,
                index === 0 && styles.filterChipTextActive,
              ]}>
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Vehicle List */}
      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}>
        {dummyVehicles.map(vehicle => (
          <TouchableOpacity key={vehicle.id} style={styles.vehicleCard}>
            <View style={styles.vehicleImageContainer}>
              <View style={styles.vehicleImagePlaceholder}>
                <VehicleIcon width={28} height={28} fill="#6b7280" />
              </View>
            </View>
            <View style={styles.vehicleInfo}>
              <Text style={styles.vehicleName}>{vehicle.name}</Text>
              <Text style={styles.vehicleNumber}>{vehicle.number}</Text>
              <View style={styles.vehicleMeta}>
                <Text style={styles.vehicleType}>{vehicle.type}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    {backgroundColor: `${getStatusColor(vehicle.status)}20`},
                  ]}>
                  <View
                    style={[
                      styles.statusDot,
                      {backgroundColor: getStatusColor(vehicle.status)},
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusText,
                      {color: getStatusColor(vehicle.status)},
                    ]}>
                    {vehicle.status.charAt(0).toUpperCase() + vehicle.status.slice(1)}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.chevron}>
              <ChevronRightIcon width={20} height={20} fill="#9ca3af" />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
  },
  addButton: {
    backgroundColor: '#e5383b',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 14,
    color: '#1f2937',
  },
  filterContainer: {
    marginBottom: 16,
    maxHeight: 44,
  },
  filterContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  filterChip: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterChipActive: {
    backgroundColor: '#e5383b',
    borderColor: '#e5383b',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  vehicleImageContainer: {
    marginRight: 16,
  },
  vehicleImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  vehicleNumber: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  vehicleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  vehicleType: {
    fontSize: 12,
    color: '#9ca3af',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  chevron: {
    padding: 4,
  },
});

export default VehicleScreen;
