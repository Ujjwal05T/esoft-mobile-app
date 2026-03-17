import React, {useState, useEffect, useCallback, useRef, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import Svg, {Path} from 'react-native-svg';
import {RootStackParamList} from '../navigation/RootNavigator';
import VehicleCard from '../components/dashboard/VehicleCard';
import InquiryCard, {Inquiry} from '../components/dashboard/InquiryCard';
import DisputeCard, {Dispute} from '../components/dashboard/DisputeCard';
import JobCard from '../components/dashboard/JobCard';
import PreviousServiceCard from '../components/dashboard/PreviousServiceCard';
import FloatingActionButton from '../components/dashboard/FloatingActionButton';
import GateOutOverlay from '../components/overlays/GateOutOverlay';
import NewJobCardOverlay from '../components/overlays/NewJobCardOverlay';
import RaiseDisputeOverlay from '../components/overlays/RaiseDisputeOverlay';
import RequestPartOverlay from '../components/overlays/RequestPartOverlay';
import AppAlert, {AlertState} from '../components/overlays/AppAlert';
import EditInquiryOverlay from '../components/overlays/EditInquiryOverlay';
import DisputeCommentsOverlay from '../components/overlays/DisputeCommentsOverlay';
import {
  getVehicleById,
  getActiveVehicleVisit,
  getJobCardsByVehicle,
  getVehicleVisitsForVehicle,
  getInquiriesByVehicleVisitId,
  getOrdersByVehicleVisitId,
  getDisputesByVehicleVisitId,
  getOrderById,
  createDisputeWithFiles,
  updateDisputeStatus,
  getStoredUser,
  createInquiryWithMedia,
  getStaffProfile,
  getInquiryById,
  SERVER_ORIGIN,
  type VehicleResponse,
  type VehicleVisitResponse,
  type JobCardResponse,
  type InquiryResponse,
  type InquiryItemResponse,
  type WorkshopOrderListItem,
  type DisputeListItemResponse,
  type InquiryItemRequest,
  type StaffPermissions,
} from '../services/api';
import type {DisputeFormData} from '../components/overlays/RaiseDisputeOverlay';
import {Order} from '../components/dashboard/OrderCard';

// ── Types ─────────────────────────────────────────────────────────────────────

type Props = NativeStackScreenProps<RootStackParamList, 'StaffVehicleDetail'>;

type ActiveTab = 'jobcard' | 'inquiry' | 'disputes';

type SectionKey = 'basicInfo' | 'problemsShared' | 'previousServices' | 'jobs';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function mapOrderStatus(s: string): Order['status'] {
  if (s === 'shipped') return 'shipped';
  if (s === 'delivered') return 'delivered';
  return 'in-process';
}

type InquiryWithNumericId = Inquiry & {numericId?: number};

function mapApiInquiry(api: InquiryResponse, vehicle: VehicleResponse): InquiryWithNumericId {
  return {
    id: api.inquiryNumber,
    numericId: api.id,
    vehicleName: api.vehicleName ?? `${vehicle.brand ?? ''} ${vehicle.model ?? ''}`.trim(),
    numberPlate: api.numberPlate ?? vehicle.plateNumber,
    placedDate: formatDate(api.placedDate),
    closedDate: api.closedDate ? formatDate(api.closedDate) : undefined,
    declinedDate: api.declinedDate ? formatDate(api.declinedDate) : undefined,
    status: api.status.toLowerCase() as Inquiry['status'],
    inquiryBy: api.requestedByName ?? 'Staff',
    jobCategories: api.jobCategories ?? [],
    items: api.items.map(item => ({
      id: item.id.toString(),
      itemName: item.partName,
      preferredBrand: item.preferredBrand,
      notes: item.remark,
      quantity: item.quantity,
      imageUrl: item.image1Url ? (item.image1Url.startsWith('http') ? item.image1Url : `${SERVER_ORIGIN}${item.image1Url}`) : undefined,
    })),
    media: [],
  };
}

type DisputeWithNumericId = Dispute & {numericId?: number; partName?: string; remark?: string; orderNumber?: string};

function mapApiDispute(api: DisputeListItemResponse): DisputeWithNumericId {
  const mapStatus = (s: string): Dispute['status'] => {
    if (s === 'Resolved') return 'closed';
    if (s === 'Requested') return 'requested';
    return 'open';
  };
  const isRequested = api.status === 'Requested';
  return {
    id: api.disputeNumber,
    numericId: api.id,
    vehicleName: '',
    plateNumber: '',
    receivedDate: formatDate(api.date),
    status: mapStatus(api.status),
    disputeRaised: api.issue,
    resolutionStatus: api.status === 'Resolved' ? 'Resolved' : api.status === 'Investigating' ? 'Under Investigation' : undefined,
    showVehicleInfo: false,
    action: isRequested ? 'edit' : 'chat',
    partName: api.partName,
    remark: api.remark,
    orderNumber: api.orderNumber,
  };
}

// ── SVG Icons ─────────────────────────────────────────────────────────────────

const BackIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 12H5M5 12L12 19M5 12L12 5"
      stroke="#161a1d"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ChevronDown = ({rotated}: {rotated: boolean}) => (
  <Svg
    width={20}
    height={20}
    viewBox="0 0 20 20"
    fill="none"
    style={rotated ? {transform: [{rotate: '180deg'}]} : undefined}>
    <Path
      d="M5 7.5l5 5 5-5"
      stroke="#2b2b2b"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// ── Accordion Section ─────────────────────────────────────────────────────────

interface AccordionProps {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function Accordion({title, expanded, onToggle, children}: AccordionProps) {
  return (
    <View style={acc.container}>
      <TouchableOpacity onPress={onToggle} activeOpacity={0.8} style={acc.header}>
        <Text style={acc.title}>{title}</Text>
        <ChevronDown rotated={expanded} />
      </TouchableOpacity>
      {expanded && (
        <View style={acc.body}>
          <View style={acc.divider} />
          {children}
        </View>
      )}
    </View>
  );
}

const acc = StyleSheet.create({
  container: {backgroundColor: '#ffffff', borderRadius: 12, overflow: 'hidden'},
  header: {paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  title: {fontSize: 15, fontWeight: '600', color: '#2b2b2b'},
  divider: {height: 1, backgroundColor: '#e5e5e5'},
  body: {paddingHorizontal: 16, paddingBottom: 16},
});

// ── Basic Info Grid ───────────────────────────────────────────────────────────

interface InfoField {label: string; value: string}

function BasicInfoGrid({fields}: {fields: InfoField[]}) {
  return (
    <View style={grid.container}>
      {fields.map((f, i) => (
        <View key={i} style={grid.cell}>
          <Text style={grid.label}>{f.label}</Text>
          <Text style={grid.value}>{f.value || 'N/A'}</Text>
        </View>
      ))}
    </View>
  );
}

const grid = StyleSheet.create({
  container: {flexDirection: 'row', flexWrap: 'wrap', paddingTop: 16, gap: 16},
  cell: {width: '30%'},
  label: {fontSize: 10, color: '#99a2b6', marginBottom: 4},
  value: {fontSize: 12, fontWeight: '500', color: '#2b2b2b'},
});

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function StaffVehicleDetailScreen({navigation, route}: Props) {
  const insets = useSafeAreaInsets();
  const vehicleId = route.params.vehicleId;

  // ── State ───────────────────────────────────────────────────────────────────
  const [appAlert, setAppAlert] = useState<AlertState | null>(null);
  const [editInquiry, setEditInquiry] = useState<{id: number; items: InquiryItemResponse[]} | null>(null);

  const handleEditInquiry = async (numericId: number) => {
    const result = await getInquiryById(numericId);
    if (result.success && result.data) {
      setEditInquiry({id: numericId, items: result.data.items});
    }
  };

  const [activeTab, setActiveTab] = useState<ActiveTab>('jobcard');
  const [expandedSections, setExpandedSections] = useState<Record<SectionKey, boolean>>({
    basicInfo: false,
    problemsShared: false,
    previousServices: false,
    jobs: true,
  });
  const [expandedInquiryId, setExpandedInquiryId] = useState<string | null>(null);

  // Overlay visibility
  const [showGateOut, setShowGateOut] = useState(false);
  const gateOutCompleted = useRef(false);
  const [showNewJob, setShowNewJob] = useState(false);
  const [showRaiseDispute, setShowRaiseDispute] = useState(false);
  const [showRequestPart, setShowRequestPart] = useState(false);

  // Data
  const [vehicle, setVehicle] = useState<VehicleResponse | null>(null);
  const [activeVisit, setActiveVisit] = useState<VehicleVisitResponse | null>(null);
  const [jobCards, setJobCards] = useState<JobCardResponse[]>([]);
  const [inquiries, setInquiries] = useState<InquiryWithNumericId[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [disputes, setDisputes] = useState<DisputeWithNumericId[]>([]);
  const [previousVisits, setPreviousVisits] = useState<VehicleVisitResponse[]>([]);
  const [disputeCommentsId, setDisputeCommentsId] = useState<number | null>(null);
  const [editDisputeItem, setEditDisputeItem] = useState<DisputeWithNumericId | null>(null);

  // Staff permissions
  const [permissions, setPermissions] = useState<StaffPermissions | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  // Loading / error
  const [loadingVehicle, setLoadingVehicle] = useState(true);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [loadingInquiries, setLoadingInquiries] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingDisputes, setLoadingDisputes] = useState(false);
  const [vehicleError, setVehicleError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Categories from job cards assigned to this staff member
  const staffCategories = useMemo(() => {
    if (!currentUserId) return [];
    return [
      ...new Set(
        jobCards
          .filter(j => j.assignedStaffIds?.includes(currentUserId))
          .map(j => j.jobCategory)
          .filter(Boolean),
      ),
    ];
  }, [jobCards, currentUserId]);

  // ── Fetch Helpers ───────────────────────────────────────────────────────────

  const fetchVehicle = useCallback(async () => {
    setLoadingVehicle(true);
    setVehicleError(false);
    try {
      const res = await getVehicleById(vehicleId);
      if (res.success && res.data) {
        setVehicle(res.data);
      } else {
        setVehicleError(true);
      }
    } catch {
      setVehicleError(true);
    } finally {
      setLoadingVehicle(false);
    }
  }, [vehicleId]);

  const fetchJobsAndVisit = useCallback(async () => {
    setLoadingJobs(true);
    try {
      const [jobRes, visitRes, allVisitsRes] = await Promise.all([
        getJobCardsByVehicle(vehicleId),
        getActiveVehicleVisit(vehicleId),
        getVehicleVisitsForVehicle(vehicleId),
      ]);
      if (jobRes.success && jobRes.data) setJobCards(jobRes.data.jobCards);
      if (visitRes.success && visitRes.data) setActiveVisit(visitRes.data);
      if (allVisitsRes.success && allVisitsRes.data) {
        const activeId = visitRes.success && visitRes.data ? visitRes.data.id : null;
        setPreviousVisits(
          allVisitsRes.data.visits.filter((v: VehicleVisitResponse) => v.id !== activeId && v.status === 'Out'),
        );
      }
    } catch (e) {
      console.error('Failed to fetch jobs/visit:', e);
    } finally {
      setLoadingJobs(false);
    }
  }, [vehicleId]);

  const fetchInquiries = useCallback(async (visitId: number) => {
    setLoadingInquiries(true);
    try {
      const res = await getInquiriesByVehicleVisitId(visitId);
      if (res.success && res.data && vehicle) {
        setInquiries(res.data.inquiries.map(i => mapApiInquiry(i, vehicle)));
      }
    } catch (e) {
      console.error('Failed to fetch inquiries:', e);
    } finally {
      setLoadingInquiries(false);
    }
  }, [vehicle]);

  const fetchOrders = useCallback(async (visitId: number) => {
    setLoadingOrders(true);
    try {
      const listRes = await getOrdersByVehicleVisitId(visitId);
      if (listRes.success && listRes.data) {
        const detailResults = await Promise.all(
          listRes.data.orders.map((o: WorkshopOrderListItem) => getOrderById(o.id)),
        );
        const mapped: Order[] = listRes.data.orders.map(
          (o: WorkshopOrderListItem, idx: number) => {
            const detail = detailResults[idx];
            const items = detail.success && detail.data ? detail.data.items : [];
            const deliveryDate =
              detail.success && detail.data?.estimatedDeliveryDate
                ? formatDate(detail.data.estimatedDeliveryDate)
                : '–';
            return {
              id: String(o.id),
              vehicleName: o.vehicleName ?? o.orderNumber,
              plateNumber: o.plateNumber ?? '',
              orderId: o.orderNumber,
              placedDate: formatDate(o.createdAt),
              deliveryDate,
              totalAmount: o.totalAmount,
              status: mapOrderStatus(o.status),
              orderedParts: items.map(item => ({
                id: String(item.id),
                name: item.partName,
                brand: item.brand,
                price: item.unitPrice,
                quantity: item.quantity,
              })),
            };
          },
        );
        setOrders(mapped);
      }
    } catch (e) {
      console.error('Failed to fetch orders:', e);
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  const fetchDisputes = useCallback(async (visitId: number) => {
    setLoadingDisputes(true);
    try {
      const res = await getDisputesByVehicleVisitId(visitId);
      if (res.success && res.data) {
        setDisputes(res.data.map(mapApiDispute));
      }
    } catch (e) {
      console.error('Failed to fetch disputes:', e);
    } finally {
      setLoadingDisputes(false);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchVehicle();
    await fetchJobsAndVisit();
    if (activeVisit) {
      await Promise.all([
        fetchInquiries(activeVisit.id),
        fetchOrders(activeVisit.id),
        fetchDisputes(activeVisit.id),
      ]);
    }
    setRefreshing(false);
  }, [fetchVehicle, fetchJobsAndVisit, fetchInquiries, fetchOrders, fetchDisputes, activeVisit]);

  useEffect(() => {
    fetchVehicle();
    getStaffProfile().then(res => {
      if (res.success && res.data) {
        setPermissions(res.data.permissions);
      }
    });
    getStoredUser().then(user => {
      if (user) setCurrentUserId(user.id);
    });
  }, [fetchVehicle]);

  useEffect(() => {
    if (vehicle) {
      fetchJobsAndVisit();
    }
  }, [vehicle, fetchJobsAndVisit]);

  useEffect(() => {
    if (activeVisit && vehicle) {
      fetchInquiries(activeVisit.id);
      fetchOrders(activeVisit.id);
      fetchDisputes(activeVisit.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeVisit?.id]);

  const toggleSection = (key: SectionKey) => {
    setExpandedSections(prev => ({...prev, [key]: !prev[key]}));
  };

  const ordersWithParts = orders.map(order => ({
    id: order.id,
    orderId: order.orderId,
    date: order.placedDate,
    parts: order.orderedParts.map(part => ({id: part.id, name: part.name})),
  }));

  const handleDisputeConfirm = async (formData: DisputeFormData) => {
    try {
      const user = await getStoredUser();
      if (!user) return;

      const staffProfileRes = await getStaffProfile();
      const workshopOwnerId = staffProfileRes.data?.workshopOwnerId ?? user.id;

      const selectedOrder = ordersWithParts.find(o => o.orderId === formData.orderId);
      if (!selectedOrder) return;

      const numericOrderId = parseInt(selectedOrder.id, 10);
      const imageFiles = formData.images.map((img, idx) => ({
        uri: img.uri,
        type: 'image/jpeg',
        name: img.name || `image_${idx}.jpg`,
      }));
      const audioFile = formData.audioPath
        ? {uri: formData.audioPath, type: 'audio/mp4', name: `audio_${Date.now()}.mp4`}
        : undefined;

      const result = await createDisputeWithFiles(
        numericOrderId,
        workshopOwnerId,
        formData.partName,
        formData.reason,
        formData.remark,
        formData.partId ? parseInt(formData.partId, 10) : undefined,
        audioFile,
        imageFiles[0],
        imageFiles[1],
        imageFiles[2],
        user.id,
      );

      if (result.success && activeVisit) {
        fetchDisputes(activeVisit.id);
      }
    } catch (error) {
      console.error('Error creating dispute:', error);
    }
  };

  const handleDisputeEditConfirm = async (data: DisputeFormData) => {
    if (!editDisputeItem?.numericId) return;
    const user = await getStoredUser();
    if (!user) return;
    const images = data.images.filter(Boolean);
    const result = await createDisputeWithFiles(
      Number(data.orderId),
      user.id,
      data.partName,
      data.reason,
      data.remark,
      data.partId ? Number(data.partId) : undefined,
      data.audioPath ? {uri: data.audioPath, name: 'audio.m4a', type: 'audio/m4a'} : undefined,
      images[0] ? {uri: images[0].uri, name: images[0].name, type: 'image/jpeg'} : undefined,
      images[1] ? {uri: images[1].uri, name: images[1].name, type: 'image/jpeg'} : undefined,
      images[2] ? {uri: images[2].uri, name: images[2].name, type: 'image/jpeg'} : undefined,
      user.id,
    );
    if (result.success) {
      setEditDisputeItem(null);
      if (activeVisit) fetchDisputes(activeVisit.id);
    }
  };

  const handleRequestPartSubmit = async (parts: any[]) => {
    try {
      const user = await getStoredUser();
      if (!user) {
        setAppAlert({type: 'error', message: 'User not found. Please log in again.'});
        return;
      }

      const audioFiles: any[] = [];
      const imageFiles: any[] = [];

      const items: InquiryItemRequest[] = parts.map(part => {
        if (part.audioPath) {
          audioFiles.push({
            uri: part.audioPath,
            name: `audio_${Date.now()}_${audioFiles.length}.mp4`,
            type: 'audio/mp4',
          });
        }
        part.images.forEach((img: any) => {
          if (img && img.uri) {
            imageFiles.push({
              uri: img.uri,
              name: img.name || `image_${Date.now()}_${imageFiles.length}.jpg`,
              type: 'image/jpeg',
            });
          }
        });
        return {
          partName: part.partName,
          preferredBrand: part.preferredBrand,
          afterMarketBrandName: part.preferredBrand === 'After Market' ? part.afterMarketBrandName : undefined,
          quantity: parseInt(part.quantity, 10) || 1,
          remark: part.remark,
          audioDuration: part.audioDuration || undefined,
        };
      });

      const staffProfileRes = await getStaffProfile();
      const workshopOwnerId = staffProfileRes.data?.workshopOwnerId ?? user.id;

      const result = await createInquiryWithMedia(
        vehicleId,
        workshopOwnerId,
        staffCategories,
        items,
        audioFiles,
        imageFiles,
        activeVisit?.id,
        user.id,
      );

      if (result.success) {
        setAppAlert({
          type: 'success',
          message: `Inquiry created successfully!\n\nInquiry Number: ${result.data?.inquiryNumber || 'N/A'}`,
          onDone: () => {
            if (activeVisit) fetchInquiries(activeVisit.id);
            setActiveTab('inquiry');
          },
        });
      } else {
        setAppAlert({type: 'error', message: result.error || 'Failed to create inquiry'});
      }
    } catch (error) {
      console.error('Error creating inquiry:', error);
      setAppAlert({type: 'error', message: 'An error occurred while creating the inquiry'});
    }
  };

  // ── Loading / Error States ─────────────────────────────────────────────────

  if (loadingVehicle) {
    return (
      <View style={[styles.centered, {paddingTop: insets.top}]}>
        <ActivityIndicator size="large" color="#e5383b" />
        <Text style={styles.loadingText}>Loading vehicle details...</Text>
      </View>
    );
  }

  if (vehicleError || !vehicle) {
    return (
      <View style={[styles.centered, {paddingTop: insets.top}]}>
        <Text style={styles.errorTitle}>Vehicle Not Found</Text>
        <Text style={styles.errorSubtitle}>
          The vehicle you're looking for doesn't exist.
        </Text>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Derived Values ──────────────────────────────────────────────────────────

  const basicInfoFields: InfoField[] = [
    {label: 'Make Year', value: vehicle.year?.toString() ?? ''},
    {label: 'Reg. Year', value: vehicle.year?.toString() ?? ''},
    {label: 'Chassis No.', value: vehicle.chassisNumber ?? ''},
    {label: 'Fuel', value: ''},
    {label: 'Transmission', value: ''},
    {label: 'Variant', value: vehicle.variant ?? vehicle.specs ?? ''},
    {label: 'Owner Name', value: vehicle.ownerName ?? ''},
    {label: 'Contact', value: vehicle.contactNumber ?? ''},
    {label: 'Odometer', value: activeVisit?.gateInOdometerReading ?? vehicle.odometerReading ?? 'N/A'},
  ];

  const tabs: {key: ActiveTab; label: string}[] = [
    {key: 'jobcard', label: 'Job card'},
    {key: 'inquiry', label: 'Inquiry'},
    {key: 'disputes', label: 'Disputes'},
  ];

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Top Bar ──────────────────────────────────────────────────────── */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          style={styles.topBarBtn}>
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Vehicle Details</Text>
        <View style={styles.topBarBtn} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, {paddingBottom: insets.bottom + 120}]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#e5383b']}
            tintColor="#e5383b"
          />
        }>

        {/* ── Vehicle Card ─────────────────────────────────────────────── */}
        <VehicleCard
          plateNumber={vehicle.plateNumber}
          year={vehicle.year ?? undefined}
          make={vehicle.brand ?? ''}
          model={vehicle.model ?? ''}
          specs={vehicle.specs ?? vehicle.variant ?? ''}
          services={activeVisit?.activeJobCategories?.slice(0, 2) ?? []}
          additionalServices={Math.max(0, (activeVisit?.activeJobCategories?.length ?? 0) - 2)}
        />

        {/* ── Tab Bar ──────────────────────────────────────────────────── */}
        <View style={styles.tabBar}>
          {tabs.map((tab, idx) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tabBarBtn,
                activeTab === tab.key && styles.tabBarBtnActive,
                idx === 0 && styles.tabBarBtnFirst,
                idx === tabs.length - 1 && styles.tabBarBtnLast,
              ]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.8}>
              <Text
                style={[
                  styles.tabBarBtnText,
                  activeTab === tab.key && styles.tabBarBtnTextActive,
                ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Job Card Tab ─────────────────────────────────────────────── */}
        {activeTab === 'jobcard' && (
          <View style={styles.tabContent}>
            <Accordion
              title="Basic Info"
              expanded={expandedSections.basicInfo}
              onToggle={() => toggleSection('basicInfo')}>
              <BasicInfoGrid fields={basicInfoFields} />
            </Accordion>

            <Accordion
              title="Problems Shared"
              expanded={expandedSections.problemsShared}
              onToggle={() => toggleSection('problemsShared')}>
              <Text style={styles.problemText}>
                {activeVisit?.gateInProblemShared || 'No problems shared for this visit'}
              </Text>
            </Accordion>

            <Accordion
              title="Previous Services"
              expanded={expandedSections.previousServices}
              onToggle={() => toggleSection('previousServices')}>
              {previousVisits.length === 0 ? (
                <View style={styles.emptyAccordion}>
                  <Text style={styles.emptyAccordionText}>No previous visits</Text>
                </View>
              ) : (
                <View style={styles.cardList}>
                  {previousVisits.map(visit => {
                    const visitJobCategories = jobCards
                      .filter(j => j.vehicleVisitId === visit.id)
                      .map(j => j.jobCategory);
                    return (
                      <PreviousServiceCard
                        key={visit.id}
                        visitDate={formatDate(visit.gateInDateTime)}
                        jobCategories={visitJobCategories}
                      />
                    );
                  })}
                </View>
              )}
            </Accordion>

            <Accordion
              title="Jobs"
              expanded={expandedSections.jobs}
              onToggle={() => toggleSection('jobs')}>
              {loadingJobs ? (
                <View style={styles.centerRow}>
                  <ActivityIndicator size="small" color="#e5383b" />
                  <Text style={styles.loadingText}>Loading jobs...</Text>
                </View>
              ) : jobCards.filter(j => j.vehicleVisitId === activeVisit?.id).length === 0 ? (
                <View style={styles.emptyAccordion}>
                  <Text style={styles.emptyAccordionText}>No jobs found</Text>
                  <Text style={styles.emptyAccordionSub}>
                    Create a new job card to get started
                  </Text>
                </View>
              ) : (
                <View style={styles.cardList}>
                  {jobCards
                    .filter(j => j.vehicleVisitId === activeVisit?.id)
                    .map(job => (
                      <JobCard
                        key={job.id}
                        id={job.id}
                        jobCategory={job.jobCategory}
                        assignedStaffNames={job.assignedStaffNames}
                        remark={job.remark}
                        audioUrl={job.audioUrl}
                        images={job.images}
                        videos={job.videos}
                        createdAt={job.createdAt}
                        status={job.status}
                        onClick={() => console.log('Job card:', job.id)}
                      />
                    ))}
                </View>
              )}
            </Accordion>
          </View>
        )}

        {/* ── Inquiry Tab ──────────────────────────────────────────────── */}
        {activeTab === 'inquiry' && (
          <View style={styles.tabContent}>
            {loadingInquiries ? (
              <View style={styles.stateCard}>
                <ActivityIndicator size="small" color="#e5383b" />
                <Text style={styles.loadingText}>Loading inquiries...</Text>
              </View>
            ) : inquiries.length === 0 ? (
              <View style={styles.stateCard}>
                <Text style={styles.emptyTitle}>No Inquiries Found</Text>
                <Text style={styles.emptySubtitle}>No inquiries found for this vehicle</Text>
              </View>
            ) : (
              <View style={styles.cardList}>
                {inquiries.map(inquiry => (
                  <InquiryCard
                    key={inquiry.id}
                    inquiry={inquiry}
                    isExpanded={expandedInquiryId === inquiry.id}
                    onToggle={() =>
                      setExpandedInquiryId(
                        expandedInquiryId === inquiry.id ? null : inquiry.id,
                      )
                    }
                    onEdit={() => { if (inquiry.numericId) handleEditInquiry(inquiry.numericId); }}
                    onView={() => {
                      if (inquiry.numericId) {
                        navigation.navigate('InquiryDetail', {inquiryId: inquiry.numericId});
                      }
                    }}
                    onApprove={() => console.log('Approve inquiry:', inquiry.id)}
                    onReRequest={() => console.log('Re-request inquiry:', inquiry.id)}
                    showNumberPlate={false}
                    action={
                      inquiry.status === 'closed' || inquiry.status === 'approved'
                        ? 'none'
                        : 'edit'
                    }
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {/* ── Disputes Tab ─────────────────────────────────────────────── */}
        {activeTab === 'disputes' && (
          <View style={styles.tabContent}>
            {loadingDisputes ? (
              <View style={styles.stateCard}>
                <ActivityIndicator size="small" color="#e5383b" />
                <Text style={styles.loadingText}>Loading disputes...</Text>
              </View>
            ) : disputes.length === 0 ? (
              <View style={styles.stateCard}>
                <Text style={styles.emptyTitle}>No Disputes Found</Text>
                <Text style={styles.emptySubtitle}>No disputes found for this vehicle</Text>
              </View>
            ) : (
              <View style={styles.cardList}>
                {disputes.map(dispute => (
                  <DisputeCard
                    key={dispute.id}
                    dispute={dispute}
                    onEdit={_id => setEditDisputeItem(dispute)}
                    onView={dispute.status === 'requested' ? _id => setEditDisputeItem(dispute) : undefined}
                    onChat={_id => {
                      if (dispute.status === 'open' && dispute.numericId) {
                        setDisputeCommentsId(dispute.numericId);
                      }
                    }}
                  />
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* ── Floating Action Button ───────────────────────────────────── */}
      <FloatingActionButton
        style={{bottom: insets.bottom + 54}}
        navigationOptions={[
          {label: 'Gate Out', onPress: () => setShowGateOut(true)},
          {
            label: 'Create New Job',
            onPress: () => setShowNewJob(true),
            disabled: permissions !== null && !permissions.createJobCard,
          },
          {
            label: 'Raise Dispute',
            onPress: () => setShowRaiseDispute(true),
            disabled:
              jobCards.length === 0 ||
              (permissions !== null && !permissions.raiseDispute),
          },
          {
            label: 'Request Part',
            onPress: () => setShowRequestPart(true),
            disabled:
              jobCards.length === 0 ||
              (permissions !== null && !permissions.createInquiry),
          },
        ]}
      />

      {/* ── Overlays ─────────────────────────────────────────────────── */}
      <GateOutOverlay
        isOpen={showGateOut}
        onClose={() => {
          setShowGateOut(false);
          if (gateOutCompleted.current) {
            gateOutCompleted.current = false;
            navigation.goBack();
          }
        }}
        onComplete={() => {
          gateOutCompleted.current = true;
        }}
        vehicleId={vehicleId}
        visitId={activeVisit?.id}
        vehicleData={{
          plateNumber: vehicle.plateNumber,
          year: vehicle.year ?? 0,
          make: vehicle.brand ?? '',
          model: vehicle.model ?? '',
          specs: vehicle.specs ?? vehicle.variant ?? '',
        }}
      />

      <NewJobCardOverlay
        isOpen={showNewJob}
        onClose={() => setShowNewJob(false)}
        vehicleId={vehicleId}
        vehicleVisitId={activeVisit?.id}
        onAddJob={() => fetchJobsAndVisit()}
      />

      <DisputeCommentsOverlay
        isOpen={disputeCommentsId !== null}
        onClose={() => setDisputeCommentsId(null)}
        disputeId={disputeCommentsId ?? 0}
      />

      <RaiseDisputeOverlay
        isOpen={showRaiseDispute}
        onClose={() => setShowRaiseDispute(false)}
        onConfirm={handleDisputeConfirm}
        orders={ordersWithParts}
        buttonText="SEND REQUEST"
        vehicleInfo={{
          plateNumber: vehicle?.plateNumber ?? '',
          year: vehicle?.year ?? 0,
          make: vehicle?.brand ?? '',
          model: vehicle?.model ?? '',
          specs: vehicle?.specs ?? vehicle?.variant ?? '',
        }}
      />

      <RaiseDisputeOverlay
        isOpen={editDisputeItem !== null}
        onClose={() => setEditDisputeItem(null)}
        onConfirm={handleDisputeEditConfirm}
        buttonText="SEND REQUEST"
        initialOrderId={editDisputeItem?.orderNumber}
        initialOrderDisplay={editDisputeItem?.orderNumber}
        initialPartName={editDisputeItem?.partName}
        initialReason={editDisputeItem?.disputeRaised}
        initialRemark={editDisputeItem?.remark}
      />

      <RequestPartOverlay
        isOpen={showRequestPart}
        onClose={() => setShowRequestPart(false)}
        onSubmit={handleRequestPartSubmit}
      />

      <EditInquiryOverlay
        isOpen={!!editInquiry}
        onClose={() => setEditInquiry(null)}
        inquiryId={editInquiry?.id ?? 0}
        initialItems={editInquiry?.items ?? []}
        onSuccess={() => { setEditInquiry(null); if (activeVisit) fetchInquiries(activeVisit.id); }}
      />

      <AppAlert
        isOpen={!!appAlert}
        type={appAlert?.type ?? 'info'}
        title={appAlert?.title}
        message={appAlert?.message ?? ''}
        onClose={() => {
          const done = appAlert?.onDone;
          setAppAlert(null);
          done?.();
        }}
        onConfirm={appAlert?.onConfirm ? () => {
          const confirm = appAlert.onConfirm!;
          setAppAlert(null);
          confirm();
        } : undefined}
      />
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f5f3f4'},
  centered: {flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f3f4', gap: 12, paddingHorizontal: 24},
  errorTitle: {fontSize: 20, fontWeight: '600', color: '#2b2b2b'},
  errorSubtitle: {fontSize: 14, color: '#99a2b6', textAlign: 'center'},
  backBtn: {marginTop: 8, backgroundColor: '#e5383b', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8},
  backBtnText: {color: '#ffffff', fontSize: 14, fontWeight: '500'},
  topBar: {height: 48, backgroundColor: '#ffffff', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0'},
  topBarBtn: {width: 32},
  topBarTitle: {flex: 1, textAlign: 'left',marginLeft: 18, fontSize: 19, fontWeight: '600', color: '#e5383b', letterSpacing: -0.64},
  scrollContent: {padding: 16, gap: 16},
  tabBar: {flexDirection: 'row', backgroundColor: '#e5e5e5', borderRadius: 8, overflow: 'hidden'},
  tabBarBtn: {flex: 1, height: 42, alignItems: 'center', justifyContent: 'center', backgroundColor: '#e5e5e5'},
  tabBarBtnActive: {backgroundColor: '#e5383b', borderRadius: 8},
  tabBarBtnFirst: {borderTopLeftRadius: 7, borderBottomLeftRadius: 7},
  tabBarBtnLast: {borderTopRightRadius: 7, borderBottomRightRadius: 7},
  tabBarBtnText: {fontSize: 13, fontWeight: '500', color: '#525252'},
  tabBarBtnTextActive: {color: '#ffffff'},
  tabContent: {gap: 12},
  cardList: {gap: 12, marginTop: 12},
  centerRow: {paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8},
  loadingText: {fontSize: 13, color: '#99a2b6'},
  problemText: {fontSize: 13, color: '#525252', paddingTop: 16, lineHeight: 20},
  emptyAccordion: {paddingTop: 16, alignItems: 'center', gap: 4},
  emptyAccordionText: {fontSize: 14, fontWeight: '500', color: '#525252'},
  emptyAccordionSub: {fontSize: 12, color: '#99a2b6'},
  stateCard: {backgroundColor: '#ffffff', borderRadius: 12, padding: 24, alignItems: 'center', gap: 8},
  emptyTitle: {fontSize: 16, fontWeight: '600', color: '#2b2b2b'},
  emptySubtitle: {fontSize: 13, color: '#99a2b6', textAlign: 'center'},
});
