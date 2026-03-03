import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import Svg, {Path} from 'react-native-svg';
import {RootStackParamList} from '../navigation/RootNavigator';
import {useAuth} from '../context/AuthContext';
import VehicleCard from '../components/dashboard/VehicleCard';
import InquiryCard, {Inquiry} from '../components/dashboard/InquiryCard';
import QuoteCard, {Quote} from '../components/dashboard/QuoteCard';
import OrderCard, {Order} from '../components/dashboard/OrderCard';
import DisputeCard, {Dispute} from '../components/dashboard/DisputeCard';
import JobCard from '../components/dashboard/JobCard';
import FloatingActionButton from '../components/dashboard/FloatingActionButton';
import GateOutOverlay from '../components/overlays/GateOutOverlay';
import EstimationOverlay from '../components/overlays/EstimationOverlay';
import NewJobCardOverlay from '../components/overlays/NewJobCardOverlay';
import RaiseDisputeOverlay from '../components/overlays/RaiseDisputeOverlay';
import RequestPartOverlay from '../components/overlays/RequestPartOverlay';
import {
  getVehicleById,
  getActiveVehicleVisit,
  getJobCardsByVehicle,
  getInquiriesByVehicleId,
  getQuotesByVehicleId,
  getOrdersByVehicleId,
  getOrderById,
  createDisputeWithFiles,
  getDisputesByWorkshopOwner,
  getStoredUser,
  createInquiryWithMedia,
  getStaffProfile,
  SERVER_ORIGIN,
  type VehicleResponse,
  type VehicleVisitResponse,
  type JobCardResponse,
  type InquiryResponse,
  type QuoteApiResponse,
  type WorkshopOrderListItem,
  type DisputeListItemResponse,
  type InquiryItemRequest,
  type StaffPermissions,
} from '../services/api';
import type {DisputeFormData} from '../components/overlays/RaiseDisputeOverlay';

// ── Types ─────────────────────────────────────────────────────────────────────

type Props = NativeStackScreenProps<RootStackParamList, 'VehicleDetail'>;

type ActiveTab = 'jobcard' | 'quotes' | 'orders' | 'inquiry' | 'disputes';

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

// Extended Inquiry type with numeric ID
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
    inquiryBy: api.requestedByName ?? 'Owner',
    jobCategory: api.jobCategory,
    items: api.items.map(item => ({
      id: item.id.toString(),
      itemName: item.partName,
      preferredBrand: item.preferredBrand,
      notes: item.remark,
      quantity: item.quantity,
      imageUrl: item.image1Url ? `${SERVER_ORIGIN}${item.image1Url}` : undefined,
    })),
    media: [],
  };
}

function mapApiQuote(api: QuoteApiResponse): Quote {
  return {
    id: api.id.toString(),
    vehicleName: api.vehicleName ?? '',
    plateNumber: api.plateNumber ?? '',
    quoteId: api.quoteNumber,
    submittedDate: formatDate(api.createdAt),
    status: api.status === 'approved' ? 'accepted' : 'pending_review',
    estimatedTotal: api.totalAmount,
    items: api.items.map(item => ({
      id: item.id.toString(),
      itemName: item.partName,
      brand: item.brand || undefined,
      mrp: item.mrp || undefined,
      price: item.unitPrice,
      quantity: item.quantity,
      isAvailable: item.availability === 'in_stock',
    })),
  };
}

function mapApiDispute(api: DisputeListItemResponse): Dispute {
  // Map backend status to frontend status
  const mapStatus = (backendStatus: string): Dispute['status'] => {
    switch (backendStatus) {
      case 'Resolved':
        return 'closed';
      case 'Pending':
      case 'Acknowledged':
      case 'Investigating':
      default:
        return 'open';
    }
  };

  return {
    id: api.disputeNumber,
    vehicleName: '', // Not shown when showVehicleInfo is false
    plateNumber: '', // Not shown when showVehicleInfo is false
    receivedDate: formatDate(api.date),
    status: mapStatus(api.status),
    disputeRaised: api.issue,
    resolutionStatus:
      api.status === 'Resolved'
        ? 'Resolved'
        : api.status === 'Investigating'
        ? 'Under Investigation'
        : undefined,
    showVehicleInfo: false,
    action: api.status === 'Pending' ? 'accept' : 'chat',
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
      <TouchableOpacity
        onPress={onToggle}
        activeOpacity={0.8}
        style={acc.header}>
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
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {fontSize: 15, fontWeight: '600', color: '#2b2b2b'},
  divider: {height: 1, backgroundColor: '#e5e5e5'},
  body: {paddingHorizontal: 16, paddingBottom: 16},
});

// ── Basic Info Grid ───────────────────────────────────────────────────────────

interface InfoField {
  label: string;
  value: string;
}

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
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingTop: 16,
    gap: 16,
  },
  cell: {width: '30%'},
  label: {fontSize: 10, color: '#99a2b6', marginBottom: 4},
  value: {fontSize: 12, fontWeight: '500', color: '#2b2b2b'},
});

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function VehicleDetailScreen({navigation, route}: Props) {
  const insets = useSafeAreaInsets();
  const vehicleId = route.params.vehicleId;
  const {userRole} = useAuth();

  // ── State ───────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<ActiveTab>('jobcard');
  const [expandedSections, setExpandedSections] = useState<Record<SectionKey, boolean>>({
    basicInfo: false,
    problemsShared: false,
    previousServices: false,
    jobs: true,
  });
  const [expandedInquiryId, setExpandedInquiryId] = useState<string | null>(null);
  const [expandedQuoteId, setExpandedQuoteId] = useState<string | null>(null);

  // Overlay visibility
  const [showGateOut, setShowGateOut] = useState(false);
  const gateOutCompleted = useRef(false);
  const [showEstimation, setShowEstimation] = useState(false);
  const [showNewJob, setShowNewJob] = useState(false);
  const [showRaiseDispute, setShowRaiseDispute] = useState(false);
  const [showRequestPart, setShowRequestPart] = useState(false);

  // Data
  const [vehicle, setVehicle] = useState<VehicleResponse | null>(null);
  const [activeVisit, setActiveVisit] = useState<VehicleVisitResponse | null>(null);
  const [jobCards, setJobCards] = useState<JobCardResponse[]>([]);
  const [inquiries, setInquiries] = useState<InquiryWithNumericId[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);

  // Staff permissions (null = owner, all actions allowed)
  const [permissions, setPermissions] = useState<StaffPermissions | null>(null);

  // Loading / error
  const [loadingVehicle, setLoadingVehicle] = useState(true);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [loadingInquiries, setLoadingInquiries] = useState(false);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingDisputes, setLoadingDisputes] = useState(false);
  const [vehicleError, setVehicleError] = useState(false);

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
      const [jobRes, visitRes] = await Promise.all([
        getJobCardsByVehicle(vehicleId),
        getActiveVehicleVisit(vehicleId),
      ]);
      if (jobRes.success && jobRes.data) {
        setJobCards(jobRes.data.jobCards);
      }
      if (visitRes.success && visitRes.data) {
        setActiveVisit(visitRes.data);
      }
    } catch (e) {
      console.error('Failed to fetch jobs/visit:', e);
    } finally {
      setLoadingJobs(false);
    }
  }, [vehicleId]);

  const fetchInquiries = useCallback(async () => {
    setLoadingInquiries(true);
    try {
      const res = await getInquiriesByVehicleId(vehicleId);
      if (res.success && res.data && vehicle) {
        setInquiries(res.data.inquiries.map(i => mapApiInquiry(i, vehicle)));
      }
    } catch (e) {
      console.error('Failed to fetch inquiries:', e);
    } finally {
      setLoadingInquiries(false);
    }
  }, [vehicleId, vehicle]);

  const fetchQuotes = useCallback(async () => {
    setLoadingQuotes(true);
    try {
      const res = await getQuotesByVehicleId(vehicleId);
      if (res.success && res.data) {
        setQuotes(res.data.quotes.map(mapApiQuote));
      }
    } catch (e) {
      console.error('Failed to fetch quotes:', e);
    } finally {
      setLoadingQuotes(false);
    }
  }, [vehicleId]);

  const fetchOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const listRes = await getOrdersByVehicleId(vehicleId);
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
  }, [vehicleId]);

  const fetchDisputes = useCallback(async () => {
    setLoadingDisputes(true);
    try {
      const user = await getStoredUser();
      if (!user) return;

      const res = await getDisputesByWorkshopOwner(user.id);
      if (res.success && res.data) {
        // Filter disputes to only show those related to this vehicle's orders
        const vehicleOrderNumbers = orders.map(o => o.orderId);
        const vehicleDisputes = res.data.filter(dispute =>
          vehicleOrderNumbers.includes(dispute.orderNumber)
        );
        setDisputes(vehicleDisputes.map(mapApiDispute));
      }
    } catch (e) {
      console.error('Failed to fetch disputes:', e);
    } finally {
      setLoadingDisputes(false);
    }
  }, [orders]);

  useEffect(() => {
    fetchVehicle();
    if (userRole === 'staff') {
      getStaffProfile().then(res => {
        if (res.success && res.data) {
          setPermissions(res.data.permissions);
        }
      });
    }
  }, [fetchVehicle, userRole]);

  useEffect(() => {
    if (vehicle) {
      fetchJobsAndVisit();
      fetchInquiries();
      fetchQuotes();
      fetchOrders();
    }
  }, [vehicle, fetchJobsAndVisit, fetchInquiries, fetchQuotes, fetchOrders]);

  // Fetch disputes after orders are loaded (since we filter by order numbers)
  useEffect(() => {
    if (orders.length > 0) {
      fetchDisputes();
    }
  }, [orders, fetchDisputes]);

  const toggleSection = (key: SectionKey) => {
    setExpandedSections(prev => ({...prev, [key]: !prev[key]}));
  };

  // Transform orders to OrderWithParts format for dispute overlay
  const ordersWithParts = orders.map(order => ({
    id: order.id,
    orderId: order.orderId,
    date: order.placedDate,
    parts: order.orderedParts.map(part => ({
      id: part.id,
      name: part.name,
    })),
  }));

  // Handle dispute form submission
  const handleDisputeConfirm = async (formData: DisputeFormData) => {
    try {
      // Get workshopOwnerId from stored user
      const user = await getStoredUser();
      if (!user) {
        console.error('User not found');
        return;
      }

      // Find the actual order by matching the order number
      const selectedOrder = ordersWithParts.find(
        o => o.orderId === formData.orderId
      );

      if (!selectedOrder) {
        console.error('Order not found:', formData.orderId);
        return;
      }

      // Get the numeric order ID
      const numericOrderId = parseInt(selectedOrder.id, 10);

      // Convert image URIs to file objects for FormData
      const imageFiles = formData.images.map((img, idx) => ({
        uri: img.uri,
        type: 'image/jpeg',
        name: img.name || `image_${idx}.jpg`,
      }));

      const audioFile = formData.audioPath
        ? {
            uri: formData.audioPath,
            type: 'audio/mp4',
            name: `audio_${Date.now()}.mp4`,
          }
        : undefined;

      const result = await createDisputeWithFiles(
        numericOrderId,
        user.id,
        formData.partName,
        formData.reason,
        formData.remark,
        formData.partId ? parseInt(formData.partId, 10) : undefined,
        audioFile,
        imageFiles[0],
        imageFiles[1],
        imageFiles[2],
      );

      if (result.success) {
        console.log('Dispute created successfully:', result.data);
        // Refresh disputes list
        fetchDisputes();
      } else {
        console.error('Failed to create dispute:', result.error);
      }
    } catch (error) {
      console.error('Error creating dispute:', error);
    }
  };

  // Handle request part form submission
  const handleRequestPartSubmit = async (parts: any[]) => {
    try {
      // Get workshopOwnerId from stored user
      const user = await getStoredUser();
      if (!user) {
        Alert.alert('Error', 'User not found. Please log in again.');
        return;
      }

      // Collect all audio and image files from parts
      const audioFiles: any[] = [];
      const imageFiles: any[] = [];

      // Transform parts data and collect files
      const items: InquiryItemRequest[] = parts.map(part => {
        // Add audio file if present
        if (part.audioPath) {
          audioFiles.push({
            uri: part.audioPath,
            name: `audio_${Date.now()}_${audioFiles.length}.mp4`,
            type: 'audio/mp4',
          });
        }

        // Add image files if present
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
          quantity: parseInt(part.quantity, 10) || 1,
          remark: part.remark,
          audioDuration: part.audioDuration || undefined,
        };
      });

      // Call API to create inquiry with media
      const result = await createInquiryWithMedia(
        vehicleId,
        user.id,
        'Parts Request',
        items,
        audioFiles,
        imageFiles,
        activeVisit?.id,
        null // requestedByStaffId - owner creating inquiry
      );

      if (result.success) {
        Alert.alert(
          'Success',
          `Inquiry created successfully!\n\nInquiry Number: ${result.data?.inquiryNumber || 'N/A'}`,
          [
            {
              text: 'OK',
              onPress: () => {
                // Refresh inquiries list and switch to inquiry tab
                fetchInquiries();
                setActiveTab('inquiry');
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to create inquiry');
      }
    } catch (error) {
      console.error('Error creating inquiry:', error);
      Alert.alert('Error', 'An error occurred while creating the inquiry');
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
    {
      label: 'Odometer',
      value: activeVisit?.gateInOdometerReading ?? vehicle.odometerReading ?? 'N/A',
    },
  ];

  // Role-aware tabs: Staff sees only Job card, Inquiry, Disputes (matching Next.js)
  const isOwnerOrAdmin = userRole === 'owner' || userRole === 'admin';

  const tabs: {key: ActiveTab; label: string}[] = [
    {key: 'jobcard', label: 'Job card'},
    ...(isOwnerOrAdmin ? [{key: 'quotes' as ActiveTab, label: 'Quotes'}] : []),
    ...(isOwnerOrAdmin ? [{key: 'orders' as ActiveTab, label: 'Orders'}] : []),
    {key: 'inquiry', label: 'Inquiry'},
    {key: 'disputes', label: 'Disputes'},
  ];

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={[styles.container]}>
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
        contentContainerStyle={[
          styles.scrollContent,
          {paddingBottom: insets.bottom + 120},
        ]}>

        {/* ── Vehicle Card ─────────────────────────────────────────────── */}
        <VehicleCard
          plateNumber={vehicle.plateNumber}
          year={vehicle.year ?? undefined}
          make={vehicle.brand ?? ''}
          model={vehicle.model ?? ''}
          specs={vehicle.specs ?? vehicle.variant ?? ''}
          services={[]}
          additionalServices={0}
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

            {/* Basic Info */}
            <Accordion
              title="Basic Info"
              expanded={expandedSections.basicInfo}
              onToggle={() => toggleSection('basicInfo')}>
              <BasicInfoGrid fields={basicInfoFields} />
            </Accordion>

            {/* Problems Shared */}
            <Accordion
              title="Problems Shared"
              expanded={expandedSections.problemsShared}
              onToggle={() => toggleSection('problemsShared')}>
              <Text style={styles.problemText}>
                {activeVisit?.gateInProblemShared ||
                  'No problems shared for this visit'}
              </Text>
            </Accordion>

            {/* Previous Services */}
            <Accordion
              title="Previous Services"
              expanded={expandedSections.previousServices}
              onToggle={() => toggleSection('previousServices')}>
              <View style={styles.emptyAccordion}>
                <Text style={styles.emptyAccordionText}>
                  No previous services found
                </Text>
                <Text style={styles.emptyAccordionSub}>
                  Service history will appear here
                </Text>
              </View>
            </Accordion>

            {/* Jobs */}
            <Accordion
              title="Jobs"
              expanded={expandedSections.jobs}
              onToggle={() => toggleSection('jobs')}>
              {loadingJobs ? (
                <View style={styles.centerRow}>
                  <ActivityIndicator size="small" color="#e5383b" />
                  <Text style={styles.loadingText}>Loading jobs...</Text>
                </View>
              ) : jobCards.length === 0 ? (
                <View style={styles.emptyAccordion}>
                  <Text style={styles.emptyAccordionText}>No jobs found</Text>
                  <Text style={styles.emptyAccordionSub}>
                    Create a new job card to get started
                  </Text>
                </View>
              ) : (
                <View style={styles.cardList}>
                  {jobCards.map(job => (
                    <JobCard
                      key={job.id}
                      id={job.id}
                      jobCategory={job.jobCategory}
                      assignedStaffName={job.assignedStaffName}
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

        {/* ── Quotes Tab ───────────────────────────────────────────────── */}
        {activeTab === 'quotes' && (
          <View style={styles.tabContent}>
            {loadingQuotes ? (
              <View style={styles.stateCard}>
                <ActivityIndicator size="small" color="#e5383b" />
                <Text style={styles.loadingText}>Loading quotes...</Text>
              </View>
            ) : quotes.length === 0 ? (
              <View style={styles.stateCard}>
                <Text style={styles.emptyTitle}>No Quotes Found</Text>
                <Text style={styles.emptySubtitle}>
                  No quotes found for this vehicle
                </Text>
              </View>
            ) : (
              <View style={styles.cardList}>
                {quotes.map(quote => (
                  <QuoteCard
                    key={quote.id}
                    quote={quote}
                    isExpanded={expandedQuoteId === quote.id}
                    onToggle={() =>
                      setExpandedQuoteId(
                        expandedQuoteId === quote.id ? null : quote.id,
                      )
                    }
                    showNumberPlate={false}
                    onAccept={id => console.log('Accept quote:', id)}
                    onView={id =>
                      navigation.navigate('QuoteDetail', {quoteId: parseInt(id)})
                    }
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {/* ── Orders Tab ───────────────────────────────────────────────── */}
        {activeTab === 'orders' && (
          <View style={styles.tabContent}>
            {loadingOrders ? (
              <View style={styles.stateCard}>
                <ActivityIndicator size="small" color="#e5383b" />
                <Text style={styles.loadingText}>Loading orders...</Text>
              </View>
            ) : orders.length === 0 ? (
              <View style={styles.stateCard}>
                <Text style={styles.emptyTitle}>No Orders Found</Text>
                <Text style={styles.emptySubtitle}>
                  Orders for this vehicle will appear here
                </Text>
              </View>
            ) : (
              <View style={styles.cardList}>
                {orders.map(order => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    defaultExpanded={false}
                    onTrackOrder={id =>
                      navigation.navigate('OrderDetail', {orderId: parseInt(id)})
                    }
                    onDownloadInvoice={id => console.log('Invoice:', id)}
                  />
                ))}
              </View>
            )}
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
                <Text style={styles.emptySubtitle}>
                  No inquiries found for this vehicle
                </Text>
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
                    onEdit={() => console.log('Edit inquiry:', inquiry.id)}
                    onView={() => {
                      // Navigate to inquiry detail screen using numeric ID
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
                <Text style={styles.emptySubtitle}>
                  No disputes found for this vehicle
                </Text>
              </View>
            ) : (
              <View style={styles.cardList}>
                {disputes.map(dispute => (
                  <DisputeCard
                    key={dispute.id}
                    dispute={dispute}
                    onEdit={id => console.log('Edit dispute:', id)}
                    onAccept={id => console.log('Accept dispute:', id)}
                    onView={id => console.log('View dispute:', id)}
                    onChat={id => console.log('Chat dispute:', id)}
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
            label: 'Generate Estimate',
            onPress: () => setShowEstimation(true),
            disabled:
              jobCards.length === 0 ||
              (permissions !== null && !permissions.generateEstimates),
          },
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

      <EstimationOverlay
        isOpen={showEstimation}
        onClose={() => setShowEstimation(false)}
        vehicleInfo={{
          plateNumber: vehicle?.plateNumber ?? '',
          year: vehicle?.year ?? 0,
          make: vehicle?.brand ?? '',
          model: vehicle?.model ?? '',
          specs: vehicle?.specs ?? vehicle?.variant ?? '',
        }}
      />

      <NewJobCardOverlay
        isOpen={showNewJob}
        onClose={() => setShowNewJob(false)}
        vehicleId={vehicleId}
        onAddJob={() => fetchJobsAndVisit()}
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
        onChatWithUs={() => {
          console.log('Chat with us clicked');
        }}
      />

      <RequestPartOverlay
        isOpen={showRequestPart}
        onClose={() => setShowRequestPart(false)}
        onSubmit={handleRequestPartSubmit}
      />
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f5f3f4'},

  // Error / loading full-screen
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f3f4',
    gap: 12,
    paddingHorizontal: 24,
  },
  errorTitle: {fontSize: 20, fontWeight: '600', color: '#2b2b2b'},
  errorSubtitle: {
    fontSize: 14,
    color: '#99a2b6',
    textAlign: 'center',
  },
  backBtn: {
    marginTop: 8,
    backgroundColor: '#e5383b',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backBtnText: {color: '#ffffff', fontSize: 14, fontWeight: '500'},

  // Top bar
  topBar: {
    height: 48,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  topBarBtn: {width: 32},
  topBarTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 19,
    fontWeight: '600',
    color: '#e5383b',
    letterSpacing: -0.64,
  },

  // Scroll
  scrollContent: {
    padding: 16,
    gap: 16,
  },

  // Tab bar (flat strip)
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#e5e5e5',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tabBarBtn: {
    flex: 1,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e5e5e5',
  },
  tabBarBtnActive: {
    backgroundColor: '#e5383b',
    borderRadius: 8,
  },
  tabBarBtnFirst: {borderTopLeftRadius: 7, borderBottomLeftRadius: 7},
  tabBarBtnLast: {borderTopRightRadius: 7, borderBottomRightRadius: 7},
  tabBarBtnText: {fontSize: 13, fontWeight: '500', color: '#525252'},
  tabBarBtnTextActive: {color: '#ffffff'},

  // Tab content area
  tabContent: {gap: 12},

  // Card list
  cardList: {gap: 12,marginTop:12},

  // Loading text
  centerRow: {
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {fontSize: 13, color: '#99a2b6'},

  // Accordion body content
  problemText: {
    fontSize: 13,
    color: '#525252',
    paddingTop: 16,
    lineHeight: 20,
  },
  emptyAccordion: {
    paddingTop: 16,
    paddingBottom: 8,
    alignItems: 'center',
    gap: 4,
  },
  emptyAccordionText: {fontSize: 14, color: '#99a2b6'},
  emptyAccordionSub: {fontSize: 12, color: '#99a2b6'},

  // State cards (loading / empty) for tabs
  stateCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {fontSize: 16, fontWeight: '500', color: '#2b2b2b'},
  emptySubtitle: {fontSize: 14, color: '#99a2b6', textAlign: 'center'},
});
