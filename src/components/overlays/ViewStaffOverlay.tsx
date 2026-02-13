import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import StaffCard, {StaffMember} from '../dashboard/StaffCard';
import VehicleCard from '../dashboard/VehicleCard';
import JobCard, {JobCardProps} from '../dashboard/JobCard';

interface ViewStaffOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  staff: StaffMember | null;
  vehicles?: {
    id: string; plateNumber: string; year?: number;
    make: string; model: string; specs: string; services?: string[];
  }[];
  jobs?: JobCardProps[];
}

type TabType = 'Vehicles' | 'Jobs';

export default function ViewStaffOverlay({
  isOpen,
  onClose,
  staff,
  vehicles = [],
  jobs = [],
}: ViewStaffOverlayProps) {
  const [activeTab, setActiveTab] = useState<TabType>('Vehicles');

  if (!staff) return null;

  return (
    <Modal visible={isOpen} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Staff Details</Text>
          <View style={{width: 60}} />
        </View>

        {/* Staff Card */}
        <View style={styles.staffSection}>
          <StaffCard staff={staff} showActions={false} />
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {(['Vehicles', 'Jobs'] as TabType[]).map(tab => (
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

        {/* Content */}
        <ScrollView style={styles.content} contentContainerStyle={styles.contentPadding}>
          {activeTab === 'Vehicles' && (
            <View style={styles.list}>
              {vehicles.length === 0 ? (
                <Text style={styles.emptyText}>No vehicles assigned</Text>
              ) : (
                vehicles.map(v => (
                  <VehicleCard
                    key={v.id}
                    plateNumber={v.plateNumber}
                    year={v.year}
                    make={v.make}
                    model={v.model}
                    specs={v.specs}
                    services={v.services}
                    variant="compact"
                  />
                ))
              )}
            </View>
          )}

          {activeTab === 'Jobs' && (
            <View style={styles.list}>
              {jobs.length === 0 ? (
                <Text style={styles.emptyText}>No jobs assigned</Text>
              ) : (
                jobs.map(job => (
                  <JobCard key={job.id} {...job} />
                ))
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#ffffff'},
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  backBtn: {padding: 4},
  backText: {fontSize: 14, color: '#e5383b', fontWeight: '500'},
  headerTitle: {fontSize: 18, fontWeight: '700', color: '#1a1a1a'},
  staffSection: {padding: 16},
  tabs: {
    flexDirection: 'row', paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  tab: {paddingHorizontal: 16, paddingVertical: 12, marginRight: 8},
  activeTab: {borderBottomWidth: 2, borderBottomColor: '#e5383b'},
  tabText: {fontSize: 14, fontWeight: '500', color: '#666666'},
  activeTabText: {color: '#e5383b', fontWeight: '600'},
  content: {flex: 1},
  contentPadding: {padding: 16},
  list: {gap: 12},
  emptyText: {fontSize: 14, color: '#9ca3af', textAlign: 'center', paddingVertical: 32},
});
