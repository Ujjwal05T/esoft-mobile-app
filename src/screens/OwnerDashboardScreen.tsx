import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
} from 'react-native';

import Header from '../components/dashboard/Header';
import StatusCard from '../components/dashboard/StatusCard';
import VehicleVector from '../assets/vectors/vehicle-vector.svg';
import InquiryVector from '../assets/vectors/inquiry-vector.svg';
import ClockVector from '../assets/vectors/clock-vector.svg';
import QuestionVector from '../assets/vectors/question-vector.svg';
import AddVehicleCard from '../components/dashboard/AddVehicleCard';
import JobsCard from '../components/dashboard/JobsCard';
import EventCard from '../components/dashboard/EventCard';
import RunningPartsCard from '../components/dashboard/RunningPartsCard';
import RaisePartsCard from '../components/dashboard/RaisePartsCard';
import FloatingActionButton from '../components/dashboard/FloatingActionButton';
import AddVehicleOverlay from '../components/overlays/AddVehicleOverlay';
import NewJobCardOverlay from '../components/overlays/NewJobCardOverlay';
import FiltersOverlay from '../components/overlays/FiltersOverlay';
import {SafeAreaView} from 'react-native-safe-area-context';

interface OwnerDashboardScreenProps {
  navigation?: any;
}

const dummyStaffList = [
  {id: '1', name: 'Amit Kumar'},
  {id: '2', name: 'Ravi Singh'},
  {id: '3', name: 'Suresh Patel'},
];

export default function OwnerDashboardScreen({navigation}: OwnerDashboardScreenProps) {
  const [addVehicleOpen, setAddVehicleOpen] = useState(false);
  const [newJobOpen, setNewJobOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const fabOptions = [
    {
      label: 'Add Vehicle',
      onPress: () => setAddVehicleOpen(true),
    },
    {
      label: 'New Job Card',
      onPress: () => setNewJobOpen(true),
    },
    {
      label: 'Filters',
      onPress: () => setFiltersOpen(true),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header (sidebar is managed internally by Header) */}
      <Header onSearchPress={() => {}} />

      {/* Main Scrollable Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* ── Status Cards – 2-column grid ── */}
        <View style={styles.statusGrid}>
          <View style={styles.statusRow}>
            <StatusCard
              title="Orders in Process"
              value="2"
              bgColor="#f24822"
              onPress={() => navigation?.navigate('Order')}
              VectorIcon={VehicleVector}
              vectorWidth={147}
              vectorHeight={130}
              vectorTop={25}
            />
            <StatusCard
              title="Pending Quotes"
              value="10"
              bgColor="#2294f2"
              onPress={() => navigation?.navigate('Inquiry')}
              VectorIcon={InquiryVector}
              vectorWidth={109}
              vectorHeight={109}
              vectorTop={46}
              vectorOpacity={0.35}
            />
          </View>
          <View style={styles.statusRow}>
            <StatusCard
              title="Pending Part Requests"
              value="8"
              bgColor="#ffad2a"
              onPress={() => navigation?.navigate('Inquiry')}
              VectorIcon={ClockVector}
              vectorWidth={147}
              vectorHeight={130}
              vectorTop={25}
            />
            <StatusCard
              title="Raised Disputes"
              value="4"
              bgColor="#e43cd3"
              onPress={() => navigation?.navigate('Inquiry')}
              VectorIcon={QuestionVector}
              vectorWidth={147}
              vectorHeight={130}
              vectorTop={25}
            />
          </View>
        </View>

        {/* ── Add New Vehicle Card ── */}
        <AddVehicleCard onPress={() => setAddVehicleOpen(true)} />

        {/* ── Pending Vehicle Requests / Jobs Card ── */}
        <JobsCard />

        {/* ── Valvoline Event Card ── */}
        <EventCard
          title="Valvoline Mechanic Meet"
          date="12 December 2025"
          time="7 PM - 10 PM"
          venue="Sayaji Effotel"
        />

        {/* ── Running Parts ── */}
        <RunningPartsCard />

        {/* ── Get Instant Quotes Card ── */}
        <RaisePartsCard text1="Get Instant Quotes" text2="For OEM Spareparts" />

        {/* ── #1 Tagline Block ── */}
        <View style={styles.taglineBlock}>
          <Text style={styles.taglineNumber}>#1</Text>
          <Text style={styles.taglineText}>
            Your One Stop{'\n'}Solution for OEM{'\n'}Spare Parts
          </Text>
        </View>

      </ScrollView>

      {/* Floating Action Button */}
      {/* <FloatingActionButton navigationOptions={fabOptions} /> */}

      {/* ── Overlays ── */}
      <AddVehicleOverlay
        isOpen={addVehicleOpen}
        onClose={() => setAddVehicleOpen(false)}
      />

      <NewJobCardOverlay
        isOpen={newJobOpen}
        onClose={() => setNewJobOpen(false)}
        staffList={dummyStaffList}
        onSubmit={data => {
          console.log('New job submitted:', data);
          setNewJobOpen(false);
        }}
      />

      <FiltersOverlay
        isOpen={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        onApply={filters => {
          console.log('Filters applied:', filters);
          setFiltersOpen(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 120,
    gap: 24,
  },
  statusGrid: {
    gap: 6,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 6,
  },
  taglineBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 8,
  },
  taglineNumber: {
    fontSize: 80,
    fontWeight: '900',
    color: '#e5383b',
    lineHeight: 77,
    letterSpacing: -1,
  },
  taglineText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#e5383b',
    lineHeight: 32,
    letterSpacing: -0.5,
  },
});
