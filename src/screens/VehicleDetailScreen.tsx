import React, {useState, useEffect, useCallback, useRef} from 'react';
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
import QuoteCard, {Quote} from '../components/dashboard/QuoteCard';
import OrderCard, {Order} from '../components/dashboard/OrderCard';
import DisputeCard, {Dispute} from '../components/dashboard/DisputeCard';
import DisputeCommentsOverlay from '../components/overlays/DisputeCommentsOverlay';
import JobCard from '../components/dashboard/JobCard';
import PreviousServiceCard from '../components/dashboard/PreviousServiceCard';
import FloatingActionButton from '../components/dashboard/FloatingActionButton';
import GateOutOverlay from '../components/overlays/GateOutOverlay';
import EstimationOverlay from '../components/overlays/EstimationOverlay';
import NewJobCardOverlay from '../components/overlays/NewJobCardOverlay';
import RaiseDisputeOverlay from '../components/overlays/RaiseDisputeOverlay';
import RequestPartOverlay from '../components/overlays/RequestPartOverlay';
import AppAlert, {AlertState} from '../components/overlays/AppAlert';
import EditInquiryOverlay from '../components/overlays/EditInquiryOverlay';
import {
  getVehicleById,
  getActiveVehicleVisit,
  getVehicleVisitsForVehicle,
  getJobCardsByVehicle,
  getInquiriesByVehicleVisitId,
  getQuotesByVehicleVisitId,
  getOrdersByVehicleVisitId,
  getOrderById,
  createDisputeWithFiles,
  updateDisputeStatus,
  acceptDispute,
  getDisputesByVehicleVisitId,
  getStoredUser,
  createInquiryWithMedia,
  getInquiryById,
  SERVER_ORIGIN,
  type VehicleResponse,
  type VehicleVisitResponse,
  type JobCardResponse,
  type InquiryResponse,
  type InquiryItemResponse,
  type QuoteApiResponse,
  type WorkshopOrderListItem,
  type DisputeListItemResponse,
  type InquiryItemRequest,
} from '../services/api';
import type {DisputeFormData} from '../components/overlays/RaiseDisputeOverlay';
import {formatDateIST} from '../utils/dateUtils';

// ── Types ─────────────────────────────────────────────────────────────────────

type Props = NativeStackScreenProps<RootStackParamList, 'VehicleDetail'>;

type ActiveTab = 'jobcard' | 'quotes' | 'orders' | 'inquiry' | 'disputes';

type SectionKey = 'basicInfo' | 'problemsShared' | 'previousServices' | 'jobs';

// ── Helpers ───────────────────────────────────────────────────────────────────

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
    placedDate: formatDateIST(api.placedDate),
    closedDate: api.closedDate ? formatDateIST(api.closedDate) : undefined,
    declinedDate: api.declinedDate ? formatDateIST(api.declinedDate) : undefined,
    status: api.status.toLowerCase() as Inquiry['status'],
    inquiryBy: api.requestedByName ?? 'Owner',
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

function mapApiQuote(api: QuoteApiResponse): Quote {
  return {
    id: api.id.toString(),
    vehicleName: api.vehicleName ?? '',
    plateNumber: api.plateNumber ?? '',
    quoteId: api.quoteNumber,
    submittedDate: formatDateIST(api.createdAt),
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

type DisputeWithExtras = Dispute & {numericId?: number; partName?: string; remark?: string; orderNumber?: string};

function mapApiDispute(api: DisputeListItemResponse): DisputeWithExtras {
  const mapStatus = (backendStatus: string): Dispute['status'] => {
    switch (backendStatus) {
      case 'Resolved': return 'closed';
      case 'Requested': return 'requested';
      default: return 'open';
    }
  };
  const isRequested = api.status === 'Requested';
  return {
    id: api.disputeNumber,
    numericId: api.id,
    vehicleName: '',
    plateNumber: '',
    receivedDate: formatDateIST(api.date),
    status: mapStatus(api.status),
    disputeRaised: api.issue,
    resolutionStatus: api.status === 'Resolved' ? 'Resolved' : api.status === 'Investigating' ? 'Under Investigation' : undefined,
    showVehicleInfo: false,
    action: isRequested ? 'accept' : 'chat',
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
  const [expandedQuoteId, setExpandedQuoteId] = useState<string | null>(null);

  // Overlay visibility
  const [showGateOut, setShowGateOut] = useState(false);
  const gateOutCompleted = useRef(false);
  const [showEstimation, setShowEstimation] = useState(false);
  const [showNewJob, setShowNewJob] = useState(false);
  const [showRaiseDispute, setShowRaiseDispute] = useState(false);
  const [showRequestPart, setShowRequestPart] = useState(false);
  const [disputeCommentsId, setDisputeCommentsId] = useState<number | null>(null);
  const [editDisputeItem, setEditDisputeItem] = useState<DisputeWithExtras | null>(null);

  // Data
  const [vehicle, setVehicle] = useState<VehicleResponse | null>(null);
  const [activeVisit, setActiveVisit] = useState<VehicleVisitResponse | null>(null);
  const [previousVisits, setPreviousVisits] = useState<VehicleVisitResponse[]>([]);
  const [jobCards, setJobCards] = useState<JobCardResponse[]>([]);
  const [inquiries, setInquiries] = useState<InquiryWithNumericId[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);

  // Loading / error
  const [loadingVehicle, setLoadingVehicle] = useState(true);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [loadingInquiries, setLoadingInquiries] = useState(false);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingDisputes, setLoadingDisputes] = useState(false);
  const [vehicleError, setVehicleError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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
      if (jobRes.success && jobRes.data) {
        setJobCards(jobRes.data.jobCards);
      }
      if (visitRes.success && visitRes.data) {
        setActiveVisit(visitRes.data);
      }
      if (allVisitsRes.success && allVisitsRes.data) {
        const activeId = visitRes.success && visitRes.data ? visitRes.data.id : null;
        setPreviousVisits(
          allVisitsRes.data.visits.filter(
            v => v.id !== activeId && v.status === 'Out',
          ),
        );
      }
    } catch (e) {
      console.error('Failed to fetch jobs/visit:', e);
    } finally {
      setLoadingJobs(false);
    }
  }, [vehicleId]);

  const fetchInquiries = useCallback(async () => {
    if (!activeVisit) return;
    setLoadingInquiries(true);
    try {
      const res = await getInquiriesByVehicleVisitId(activeVisit.id);
      if (res.success && res.data && vehicle) {
        setInquiries(res.data.inquiries.map((i: InquiryResponse) => mapApiInquiry(i, vehicle)));
      }
    } catch (e) {
      console.error('Failed to fetch inquiries:', e);
    } finally {
      setLoadingInquiries(false);
    }
  }, [activeVisit, vehicle]);

  const fetchQuotes = useCallback(async () => {
    if (!activeVisit) return;
    setLoadingQuotes(true);
    try {
      const res = await getQuotesByVehicleVisitId(activeVisit.id);
      if (res.success && res.data) {
        setQuotes(res.data.quotes.map(mapApiQuote));
      }
    } catch (e) {
      console.error('Failed to fetch quotes:', e);
    } finally {
      setLoadingQuotes(false);
    }
  }, [activeVisit]);

  const fetchOrders = useCallback(async () => {
    if (!activeVisit) return;
    setLoadingOrders(true);
    try {
      const listRes = await getOrdersByVehicleVisitId(activeVisit.id);
      if (listRes.success && listRes.data) {
        const detailResults = await Promise.all(
          listRes.data.orders.map((o: WorkshopOrderListItem) => getOrderById(o.id)),
        );
        const mapped: Order[] = listRes.data.orders.map(
          (o: WorkshopOrderListItem, idx: number) => {
            const detail = detailResults[idx];
            const items: Array<{id: number; partName: string; brand: string; unitPrice: number; quantity: number}> =
              detail.success && detail.data ? detail.data.items : [];
            const deliveryDate =
              detail.success && detail.data?.estimatedDeliveryDate
                ? formatDateIST(detail.data.estimatedDeliveryDate)
                : '–';
            return {
              id: String(o.id),
              vehicleName: o.vehicleName ?? o.orderNumber,
              plateNumber: o.plateNumber ?? '',
              orderId: o.orderNumber,
              placedDate: formatDateIST(o.createdAt),
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
  }, [activeVisit]);

  const fetchDisputes = useCallback(async () => {
    if (!activeVisit) return;
    setLoadingDisputes(true);
    try {
      const res = await getDisputesByVehicleVisitId(activeVisit.id);
      if (res.success && res.data) {
        setDisputes(res.data.map((d: DisputeListItemResponse) => ({
          ...mapApiDispute(d),
          numericId: d.id,
        })));
      }
    } catch (e) {
      console.error('Failed to fetch disputes:', e);
    } finally {
      setLoadingDisputes(false);
    }
  }, [activeVisit]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchVehicle(), fetchJobsAndVisit()]);
    if (activeVisit) {
      await Promise.all([fetchInquiries(), fetchQuotes(), fetchOrders(), fetchDisputes()]);
    }
    setRefreshing(false);
  }, [fetchVehicle, fetchJobsAndVisit, fetchInquiries, fetchQuotes, fetchOrders, fetchDisputes, activeVisit]);

  useEffect(() => {
    fetchVehicle();
  }, [fetchVehicle]);

  useEffect(() => {
    if (vehicle) {
      fetchJobsAndVisit();
    }
  }, [vehicle, fetchJobsAndVisit]);

  useEffect(() => {
    if (activeVisit) {
      fetchInquiries();
      fetchQuotes();
      fetchOrders();
      fetchDisputes();
    }
  }, [activeVisit, fetchInquiries, fetchQuotes, fetchOrders, fetchDisputes]);

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

  const handleAcceptDispute = (dispute: DisputeWithExtras) => {
    if (!dispute.numericId) return;
    setAppAlert({
      type: 'confirm',
      title: 'Accept Dispute',
      message: `Accept the dispute request for "${dispute.disputeRaised}"? It will be moved to Pending status.`,
      confirmText: 'Accept',
      onConfirm: async () => {
        const u = await getStoredUser();
        if (!u) return;
        const res = await acceptDispute(dispute.numericId!, u.id);
        if (res.success) fetchDisputes();
        else setAppAlert({type: 'error', message: 'Failed to accept dispute. Please try again.'});
      },
    });
  };

  // Handle request part form submission
  const handleRequestPartSubmit = async (parts: any[]) => {
    try {
      // Get workshopOwnerId from stored user
      const user = await getStoredUser();
      if (!user) {
        setAppAlert({type: 'error', message: 'User not found. Please log in again.'});
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
          afterMarketBrandName: part.preferredBrand === 'After Market' ? part.afterMarketBrandName : undefined,
          quantity: parseInt(part.quantity, 10) || 1,
          remark: part.remark,
          audioDuration: part.audioDuration || undefined,
        };
      });

      // Call API to create inquiry with media
      const result = await createInquiryWithMedia(
        vehicleId,
        user.id,
        activeVisit?.activeJobCategories ?? [],
        items,
        audioFiles,
        imageFiles,
        activeVisit?.id,
        null // requestedByStaffId - owner creating inquiry
      );

      if (result.success) {
        setAppAlert({type: 'success', message: `Inquiry created successfully!\n\nInquiry Number: ${result.data?.inquiryNumber || 'N/A'}`, onDone: () => { fetchInquiries(); setActiveTab('inquiry'); }});
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
    {
      label: 'Odometer',
      value: activeVisit?.gateInOdometerReading ?? vehicle.odometerReading ?? 'N/A',
    },
  ];

  const tabs: {key: ActiveTab; label: string}[] = [
    {key: 'jobcard', label: 'Job card'},
    {key: 'quotes', label: 'Quotes'},
    {key: 'orders', label: 'Orders'},
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
        ]}
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
                        visitDate={formatDateIST(visit.gateInDateTime)}
                        jobCategories={visitJobCategories}
                      />
                    );
                  })}
                </View>
              )}
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
                    onEdit={() => { if (inquiry.numericId) handleEditInquiry(inquiry.numericId); }}
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
                    onAccept={_id => handleAcceptDispute(dispute)}
                    onChat={_id => {
                      if (dispute.status === 'open' && (dispute as any).numericId) {
                        setDisputeCommentsId((dispute as any).numericId);
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
            label: 'Generate Estimate',
            onPress: () => setShowEstimation(true),
            disabled: jobCards.length === 0,
          },
          {label: 'Create New Job', onPress: () => setShowNewJob(true)},
          {
            label: 'Raise Dispute',
            onPress: () => setShowRaiseDispute(true),
            disabled: jobCards.length === 0,
          },
          {
            label: 'Request Part',
            onPress: () => setShowRequestPart(true),
            disabled: jobCards.length === 0,
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
        onSuccess={() => { setEditInquiry(null); fetchInquiries(); }}
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
    textAlign: 'left',
    marginLeft: 18,
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
