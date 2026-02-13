import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableWithoutFeedback,
} from 'react-native';
import FloatingInput from '../ui/FloatingInput';

interface FiltersOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onApply?: (filters: FilterState) => void;
}

interface FilterState {
  dateFrom: string;
  dateTo: string;
  vehicleNumber: string;
  brand: string;
  sortBy: 'amount' | 'relevance' | 'date';
}

type TabType = 'Date' | 'Vehicle' | 'Sort';

export default function FiltersOverlay({
  isOpen,
  onClose,
  onApply,
}: FiltersOverlayProps) {
  const [activeTab, setActiveTab] = useState<TabType>('Date');
  const [filters, setFilters] = useState<FilterState>({
    dateFrom: '',
    dateTo: '',
    vehicleNumber: '',
    brand: '',
    sortBy: 'relevance',
  });

  const setField = (field: keyof FilterState) => (value: string) =>
    setFilters(prev => ({...prev, [field]: value}));

  const sortOptions: {label: string; value: FilterState['sortBy']}[] = [
    {label: 'By Amount', value: 'amount'},
    {label: 'By Relevance', value: 'relevance'},
    {label: 'By Date', value: 'date'},
  ];

  const handleApply = () => {
    onApply?.(filters);
    onClose();
  };

  const handleReset = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      vehicleNumber: '',
      brand: '',
      sortBy: 'relevance',
    });
  };

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <View style={styles.sheet}>
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Filters</Text>
          <TouchableOpacity onPress={handleReset}>
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {(['Date', 'Vehicle', 'Sort'] as TabType[]).map(tab => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tab, activeTab === tab && styles.activeTab]}>
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {activeTab === 'Date' && (
            <View>
              <FloatingInput label="From Date" value={filters.dateFrom} onChange={setField('dateFrom')} />
              <FloatingInput label="To Date" value={filters.dateTo} onChange={setField('dateTo')} />
            </View>
          )}

          {activeTab === 'Vehicle' && (
            <View>
              <FloatingInput label="Vehicle Number" value={filters.vehicleNumber} onChange={setField('vehicleNumber')} />
              <FloatingInput label="Brand" value={filters.brand} onChange={setField('brand')} />
            </View>
          )}

          {activeTab === 'Sort' && (
            <View style={styles.sortOptions}>
              {sortOptions.map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => setFilters(prev => ({...prev, sortBy: opt.value}))}
                  style={styles.sortOption}>
                  <View style={[
                    styles.radioOuter,
                    filters.sortBy === opt.value && styles.radioOuterActive,
                  ]}>
                    {filters.sortBy === opt.value && <View style={styles.radioInner} />}
                  </View>
                  <Text style={styles.sortLabel}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Buttons */}
        <View style={styles.buttons}>
          <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleApply} style={styles.applyBtn}>
            <Text style={styles.applyText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingHorizontal: 16, paddingBottom: 32, paddingTop: 12,
    maxHeight: '80%',
  },
  handle: {
    width: 40, height: 4, backgroundColor: '#d1d5db',
    borderRadius: 2, alignSelf: 'center', marginBottom: 20,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {fontSize: 20, fontWeight: '700', color: '#1a1a1a'},
  resetText: {fontSize: 14, fontWeight: '500', color: '#e5383b'},
  tabs: {flexDirection: 'row', borderRadius: 8, backgroundColor: '#f5f5f5', padding: 4, marginBottom: 16},
  tab: {flex: 1, paddingVertical: 8, borderRadius: 6, alignItems: 'center'},
  activeTab: {backgroundColor: '#ffffff', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3, elevation: 2},
  tabText: {fontSize: 14, fontWeight: '500', color: '#666666'},
  activeTabText: {color: '#e5383b', fontWeight: '600'},
  content: {flex: 1},
  sortOptions: {gap: 16, paddingTop: 8},
  sortOption: {flexDirection: 'row', alignItems: 'center', gap: 12},
  radioOuter: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: '#d4d9e3',
    alignItems: 'center', justifyContent: 'center',
  },
  radioOuterActive: {borderColor: '#e5383b'},
  radioInner: {width: 10, height: 10, borderRadius: 5, backgroundColor: '#e5383b'},
  sortLabel: {fontSize: 16, color: '#1a1a1a'},
  buttons: {flexDirection: 'row', gap: 12, marginTop: 16},
  cancelBtn: {
    flex: 1, height: 52, borderRadius: 8,
    borderWidth: 1, borderColor: '#d4d9e3',
    alignItems: 'center', justifyContent: 'center',
  },
  cancelText: {fontSize: 14, fontWeight: '600', color: '#666666'},
  applyBtn: {
    flex: 1, height: 52, borderRadius: 8,
    backgroundColor: '#e5383b', alignItems: 'center', justifyContent: 'center',
  },
  applyText: {fontSize: 14, fontWeight: '600', color: '#ffffff'},
});
