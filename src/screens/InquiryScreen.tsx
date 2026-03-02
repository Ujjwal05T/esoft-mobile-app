import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/RootNavigator';
import Svg, {Path} from 'react-native-svg';
import Header from '../components/dashboard/Header';
import InquiryCard, {
  Inquiry,
} from '../components/dashboard/InquiryCard';
import QuoteCard, {Quote} from '../components/dashboard/QuoteCard';
import DisputeCard, {Dispute} from '../components/dashboard/DisputeCard';
import FloatingActionButton from '../components/dashboard/FloatingActionButton';
import FiltersOverlay, {FilterData} from '../components/overlays/FiltersOverlay';
import VehicleSelectionOverlay, {
  type VehicleInfo,
} from '../components/overlays/VehicleSelectionOverlay';
import RequestPartOverlay from '../components/overlays/RequestPartOverlay';
import RaiseDisputeOverlay from '../components/overlays/RaiseDisputeOverlay';
import {
  getStoredUser,
  getInquiriesByWorkshopOwnerId,
  getQuotesByWorkshopOwnerId,
  getDisputesByWorkshopOwner,
  getOrdersByVehicleId,
  getOrderById,
  createInquiryWithMedia,
  createDisputeWithFiles,
  type InquiryResponse,
  type QuoteApiResponse,
  type DisputeListItemResponse,
  type VehicleResponse,
  type WorkshopOrderListItem,
  type InquiryItemRequest,
} from '../services/api';

// ── Types ─────────────────────────────────────────────────────────────────────

type ActiveTab = 'inquiries' | 'quotes' | 'disputes';

// Extended types with rawDate for filtering
type InquiryWithDate = Inquiry & {rawDate?: string; numericId?: number};
type QuoteWithDate = Quote & {rawDate?: string};
type DisputeWithDate = Dispute & {rawDate?: string};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function mapApiInquiry(api: InquiryResponse): InquiryWithDate {
  return {
    id: api.inquiryNumber,
    numericId: api.id,
    vehicleName: api.vehicleName ?? '',
    numberPlate: api.numberPlate ?? '',
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
      imageUrl: item.image1Url ?? undefined,
    })),
    media: [],
    rawDate: api.placedDate,
  };
}

function mapApiQuote(api: QuoteApiResponse): QuoteWithDate {
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
    rawDate: api.createdAt,
  };
}

function mapApiDispute(api: DisputeListItemResponse): DisputeWithDate {
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
    resolutionStatus: api.status === 'Resolved' ? 'Resolved' : api.status === 'Investigating' ? 'Under Investigation' : undefined,
    showVehicleInfo: false,
    action: api.status === 'Pending' ? 'accept' : 'chat',
    rawDate: api.date,
  };
}

// Parse date from DD/MM/YY format to Date object
function parseFilterDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const [day, month, year] = dateStr.split('/');
  const fullYear = parseInt('20' + year);
  return new Date(fullYear, parseInt(month) - 1, parseInt(day));
}

// Check if a date is within range
function isDateInRange(
  dateStr: string | undefined,
  startDate: string,
  endDate: string,
): boolean {
  if (!dateStr || (!startDate && !endDate)) return true;

  const date = new Date(dateStr);
  const start = parseFilterDate(startDate);
  const end = parseFilterDate(endDate);

  if (start && date < start) return false;
  if (end && date > end) return false;

  return true;
}

// Count active filters
function countActiveFilters(filters: FilterData): number {
  let count = 0;
  if (filters.startDate || filters.endDate) count++;
  if (filters.brand) count++;
  if (filters.model) count++;
  if (filters.year) count++;
  if (filters.vehicleNumber) count++;
  if (filters.assignedTo) count++;
  if (filters.addedBy) count++;
  if (filters.sortBy) count++;
  return count;
}

// ── Filter Icon ───────────────────────────────────────────────────────────────

const FilterIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
    <Path
      d="M4 11L4 5"
      stroke="#E5383B"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 11L12 5"
      stroke="#E5383B"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M6 5L4 3L2 5"
      stroke="#E5383B"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M14 11L12 13L10 11"
      stroke="#E5383B"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function InquiryScreen() {
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [activeTab, setActiveTab] = useState<ActiveTab>('inquiries');
  const [inquiries, setInquiries] = useState<InquiryWithDate[]>([]);
  const [quotes, setQuotes] = useState<QuoteWithDate[]>([]);
  const [disputes, setDisputes] = useState<DisputeWithDate[]>([]);
  const [filteredInquiries, setFilteredInquiries] = useState<InquiryWithDate[]>([]);
  const [filteredQuotes, setFilteredQuotes] = useState<QuoteWithDate[]>([]);
  const [filteredDisputes, setFilteredDisputes] = useState<DisputeWithDate[]>([]);
  const [loadingInquiries, setLoadingInquiries] = useState(false);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [loadingDisputes, setLoadingDisputes] = useState(false);
  const [expandedInquiryId, setExpandedInquiryId] = useState<string | null>(null);
  const [expandedQuoteId, setExpandedQuoteId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterData>({
    startDate: '',
    endDate: '',
    brand: '',
    model: '',
    year: '',
    vehicleNumber: '',
    assignedTo: '',
    addedBy: '',
    sortBy: null,
  });

  // Overlay states
  const [showVehicleSelection, setShowVehicleSelection] = useState(false);
  const [targetOverlay, setTargetOverlay] = useState<'requestPart' | 'raiseDispute' | null>(null);
  const [showRequestPart, setShowRequestPart] = useState(false);
  const [showRaiseDispute, setShowRaiseDispute] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleResponse | null>(null);
  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo | null>(null);
  const [vehicleOrders, setVehicleOrders] = useState<any[]>([]);

  // ── Filter Functions ────────────────────────────────────────────────────────

  const applyInquiryFilters = useCallback((inquiryList: InquiryWithDate[], filters: FilterData) => {
    let filtered = [...inquiryList];

    // Filter by date range
    if (filters.startDate || filters.endDate) {
      filtered = filtered.filter(i =>
        isDateInRange(i.rawDate, filters.startDate, filters.endDate),
      );
    }

    // Filter by vehicle number
    if (filters.vehicleNumber) {
      filtered = filtered.filter(i =>
        i.numberPlate?.toUpperCase().includes(filters.vehicleNumber.toUpperCase()),
      );
    }

    // Filter by added by (inquiryBy)
    if (filters.addedBy) {
      filtered = filtered.filter(i =>
        i.inquiryBy?.toUpperCase().includes(filters.addedBy.toUpperCase()),
      );
    }

    // Sort
    if (filters.sortBy === 'relevance') {
      filtered.sort((a, b) => a.id.localeCompare(b.id));
    }

    return filtered;
  }, []);

  const applyQuoteFilters = useCallback((quoteList: QuoteWithDate[], filters: FilterData) => {
    let filtered = [...quoteList];

    // Filter by date range
    if (filters.startDate || filters.endDate) {
      filtered = filtered.filter(q =>
        isDateInRange(q.rawDate, filters.startDate, filters.endDate),
      );
    }

    // Filter by vehicle number
    if (filters.vehicleNumber) {
      filtered = filtered.filter(q =>
        q.plateNumber.toUpperCase().includes(filters.vehicleNumber.toUpperCase()),
      );
    }

    // Sort by amount
    if (filters.sortBy === 'amount_low_high') {
      filtered.sort((a, b) => a.estimatedTotal - b.estimatedTotal);
    } else if (filters.sortBy === 'amount_high_low') {
      filtered.sort((a, b) => b.estimatedTotal - a.estimatedTotal);
    }

    return filtered;
  }, []);

  const applyDisputeFilters = useCallback((disputeList: DisputeWithDate[], filters: FilterData) => {
    let filtered = [...disputeList];

    // Filter by date range
    if (filters.startDate || filters.endDate) {
      filtered = filtered.filter(d =>
        isDateInRange(d.rawDate, filters.startDate, filters.endDate),
      );
    }

    // Sort
    if (filters.sortBy === 'relevance') {
      filtered.sort((a, b) => a.id.localeCompare(b.id));
    }

    return filtered;
  }, []);

  // ── Data Fetching ───────────────────────────────────────────────────────────

  const fetchInquiries = useCallback(async () => {
    setLoadingInquiries(true);
    try {
      const user = await getStoredUser();
      if (!user) return;
      const res = await getInquiriesByWorkshopOwnerId(user.id);
      if (res.success && res.data) {
        const mapped = res.data.inquiries.map(mapApiInquiry);
        setInquiries(mapped);
        setFilteredInquiries(applyInquiryFilters(mapped, activeFilters));
      }
    } catch (e) {
      console.error('Failed to fetch inquiries:', e);
    } finally {
      setLoadingInquiries(false);
    }
  }, [activeFilters, applyInquiryFilters]);

  const fetchQuotes = useCallback(async () => {
    setLoadingQuotes(true);
    try {
      const user = await getStoredUser();
      if (!user) return;
      const res = await getQuotesByWorkshopOwnerId(user.id);
      if (res.success && res.data) {
        const mapped = res.data.quotes.map(mapApiQuote);
        setQuotes(mapped);
        setFilteredQuotes(applyQuoteFilters(mapped, activeFilters));
      }
    } catch (e) {
      console.error('Failed to fetch quotes:', e);
    } finally {
      setLoadingQuotes(false);
    }
  }, [activeFilters, applyQuoteFilters]);

  const fetchDisputes = useCallback(async () => {
    setLoadingDisputes(true);
    try {
      const user = await getStoredUser();
      if (!user) return;
      const res = await getDisputesByWorkshopOwner(user.id);
      if (res.success && res.data) {
        const mapped = res.data.map(mapApiDispute);
        setDisputes(mapped);
        setFilteredDisputes(applyDisputeFilters(mapped, activeFilters));
      }
    } catch (e) {
      console.error('Failed to fetch disputes:', e);
    } finally {
      setLoadingDisputes(false);
    }
  }, [activeFilters, applyDisputeFilters]);

  useEffect(() => {
    fetchInquiries();
    fetchQuotes();
    fetchDisputes();
  }, [fetchInquiries, fetchQuotes, fetchDisputes]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleApplyFilters = (filters: FilterData) => {
    setActiveFilters(filters);
    setFilteredInquiries(applyInquiryFilters(inquiries, filters));
    setFilteredQuotes(applyQuoteFilters(quotes, filters));
    setFilteredDisputes(applyDisputeFilters(disputes, filters));
    setShowFilters(false);
  };

  const getTitle = () => {
    switch (activeTab) {
      case 'quotes':    return 'Quotes';
      case 'disputes':  return 'Disputes';
      default:          return 'Inquiries';
    }
  };

  const getSubtitle = () => {
    switch (activeTab) {
      case 'quotes':    return 'Review and accept quotes from vendors';
      case 'disputes':  return 'Handle and resolve your disputes';
      default:          return 'Manage and review all your inquiries';
    }
  };

  const filterCount = countActiveFilters(activeFilters);

  // ── FAB Handlers ────────────────────────────────────────────────────────────

  const handleRequestPart = () => {
    setTargetOverlay('requestPart');
    setShowVehicleSelection(true);
  };

  const handleRaiseDispute = () => {
    setTargetOverlay('raiseDispute');
    setShowVehicleSelection(true);
  };

  const handleVehicleSelected = async (vehicle: VehicleResponse, info: VehicleInfo) => {
    setSelectedVehicle(vehicle);
    setVehicleInfo(info);

    // Fetch orders if raising dispute
    if (targetOverlay === 'raiseDispute') {
      try {
        const listRes = await getOrdersByVehicleId(vehicle.id);
        if (listRes.success && listRes.data) {
          const detailResults = await Promise.all(
            listRes.data.orders.map((o: WorkshopOrderListItem) => getOrderById(o.id)),
          );

          const ordersWithParts = listRes.data.orders.map(
            (o: WorkshopOrderListItem, idx: number) => {
              const detail = detailResults[idx];
              const items = detail.success && detail.data ? detail.data.items : [];
              return {
                id: String(o.id),
                orderId: o.orderNumber,
                date: formatDate(o.createdAt),
                parts: items.map(item => ({
                  id: String(item.id),
                  name: item.partName,
                })),
              };
            },
          );
          setVehicleOrders(ordersWithParts);
        }
      } catch (error) {
        console.error('Failed to fetch orders:', error);
        setVehicleOrders([]);
      }
      setShowRaiseDispute(true);
    } else if (targetOverlay === 'requestPart') {
      setShowRequestPart(true);
    }
  };

  const handleRequestPartSubmit = async (parts: any[]) => {
    try {
      const user = await getStoredUser();
      if (!user || !selectedVehicle) {
        Alert.alert('Error', 'User or vehicle not found. Please try again.');
        return;
      }

      // Collect all audio and image files from parts
      const audioFiles: any[] = [];
      const imageFiles: any[] = [];

      // Transform parts data and collect files
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
          quantity: parseInt(part.quantity, 10) || 1,
          remark: part.remark,
          audioDuration: part.audioDuration || undefined,
        };
      });

      const result = await createInquiryWithMedia(
        selectedVehicle.id,
        user.id,
        'Parts Request',
        items,
        audioFiles,
        imageFiles,
        undefined, // vehicleVisitId
        null, // requestedByStaffId
      );

      if (result.success) {
        Alert.alert(
          'Success',
          `Inquiry created successfully!\n\nInquiry Number: ${result.data?.inquiryNumber || 'N/A'}`,
          [
            {
              text: 'OK',
              onPress: () => {
                setShowRequestPart(false);
                fetchInquiries();
              },
            },
          ],
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to create inquiry');
      }
    } catch (error) {
      console.error('Error creating inquiry:', error);
      Alert.alert('Error', 'An error occurred while creating the inquiry');
    }
  };

  const handleDisputeConfirm = async (formData: any) => {
    try {
      const user = await getStoredUser();
      if (!user) {
        Alert.alert('Error', 'User not found. Please log in again.');
        return;
      }

      const selectedOrder = vehicleOrders.find(
        o => o.orderId === formData.orderId,
      );

      if (!selectedOrder) {
        Alert.alert('Error', 'Order not found');
        return;
      }

      const numericOrderId = parseInt(selectedOrder.id, 10);

      const imageFiles = formData.images.map((img: any, idx: number) => ({
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
        Alert.alert('Success', 'Dispute created successfully', [
          {
            text: 'OK',
            onPress: () => {
              setShowRaiseDispute(false);
              fetchDisputes();
            },
          },
        ]);
      } else {
        Alert.alert('Error', result.error || 'Failed to create dispute');
      }
    } catch (error) {
      console.error('Error creating dispute:', error);
      Alert.alert('Error', 'An error occurred while creating the dispute');
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      {/* ── Header ───────────────────────────────────────────────────── */}
      {/* <Header /> */}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {paddingBottom: insets.bottom + 120},
        ]}>

        {/* ── Page Title ───────────────────────────────────────────────── */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>{getTitle()}</Text>
          {/* <Text style={styles.subtitle}>{getSubtitle()}</Text> */}
        </View>

        {/* ── Tab Toggle + Filter ───────────────────────────────────────── */}
        <View style={styles.filterRow}>
          <View style={styles.tabToggle}>
            <TouchableOpacity
              style={[
                styles.tabBtn,
                activeTab === 'inquiries' && styles.tabBtnActive,
              ]}
              onPress={() => setActiveTab('inquiries')}
              activeOpacity={0.8}>
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'inquiries' && styles.tabBtnTextActive,
                ]}>
                Inquiries
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tabBtn,
                activeTab === 'quotes' && styles.tabBtnActive,
              ]}
              onPress={() => setActiveTab('quotes')}
              activeOpacity={0.8}>
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'quotes' && styles.tabBtnTextActive,
                ]}>
                Quotes
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tabBtn,
                activeTab === 'disputes' && styles.tabBtnActive,
              ]}
              onPress={() => setActiveTab('disputes')}
              activeOpacity={0.8}>
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'disputes' && styles.tabBtnTextActive,
                ]}>
                Disputes
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => setShowFilters(true)}
            activeOpacity={0.8}>
            <FilterIcon />
            <Text style={styles.filterBtnText}>Filter</Text>
            {filterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{filterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Inquiries Tab ─────────────────────────────────────────────── */}
        {activeTab === 'inquiries' && (
          <View style={styles.cardList}>
            {loadingInquiries ? (
              <View style={styles.stateCard}>
                <ActivityIndicator size="small" color="#e5383b" />
                <Text style={styles.loadingText}>Loading inquiries...</Text>
              </View>
            ) : filteredInquiries.length === 0 ? (
              <View style={styles.stateCard}>
                <Text style={styles.emptyTitle}>
                  {filterCount > 0 ? 'No inquiries match your filters' : 'No Inquiries Found'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {filterCount > 0
                    ? 'Try adjusting your filter criteria'
                    : 'Your inquiries will appear here'}
                </Text>
                {filterCount > 0 && (
                  <TouchableOpacity
                    style={styles.clearFiltersBtn}
                    onPress={() => handleApplyFilters({
                      startDate: '',
                      endDate: '',
                      brand: '',
                      model: '',
                      year: '',
                      vehicleNumber: '',
                      assignedTo: '',
                      addedBy: '',
                      sortBy: null,
                    })}
                    activeOpacity={0.8}>
                    <Text style={styles.clearFiltersBtnText}>Clear Filters</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              filteredInquiries.map(inquiry => (
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
                  showNumberPlate={true}
                  action="approve"
                />
              ))
            )}
          </View>
        )}

        {/* ── Quotes Tab ────────────────────────────────────────────────── */}
        {activeTab === 'quotes' && (
          <View style={styles.cardList}>
            {loadingQuotes ? (
              <View style={styles.stateCard}>
                <ActivityIndicator size="small" color="#e5383b" />
                <Text style={styles.loadingText}>Loading quotes...</Text>
              </View>
            ) : filteredQuotes.length === 0 ? (
              <View style={styles.stateCard}>
                <Text style={styles.emptyTitle}>
                  {filterCount > 0 ? 'No quotes match your filters' : 'No Quotes Found'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {filterCount > 0
                    ? 'Try adjusting your filter criteria'
                    : 'Your quotes will appear here'}
                </Text>
                {filterCount > 0 && (
                  <TouchableOpacity
                    style={styles.clearFiltersBtn}
                    onPress={() => handleApplyFilters({
                      startDate: '',
                      endDate: '',
                      brand: '',
                      model: '',
                      year: '',
                      vehicleNumber: '',
                      assignedTo: '',
                      addedBy: '',
                      sortBy: null,
                    })}
                    activeOpacity={0.8}>
                    <Text style={styles.clearFiltersBtnText}>Clear Filters</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              filteredQuotes.map(quote => (
                <QuoteCard
                  key={quote.id}
                  quote={quote}
                  isExpanded={expandedQuoteId === quote.id}
                  onToggle={() =>
                    setExpandedQuoteId(
                      expandedQuoteId === quote.id ? null : quote.id,
                    )
                  }
                  showNumberPlate={true}
                  onAccept={id => console.log('Accept quote:', id)}
                  onView={id =>
                    navigation.navigate('QuoteDetail', {quoteId: parseInt(id)})
                  }
                />
              ))
            )}
          </View>
        )}

        {/* ── Disputes Tab ──────────────────────────────────────────────── */}
        {activeTab === 'disputes' && (
          <View style={styles.cardList}>
            {loadingDisputes ? (
              <View style={styles.stateCard}>
                <ActivityIndicator size="small" color="#e5383b" />
                <Text style={styles.loadingText}>Loading disputes...</Text>
              </View>
            ) : filteredDisputes.length === 0 ? (
              <View style={styles.stateCard}>
                <Text style={styles.emptyTitle}>
                  {filterCount > 0 ? 'No disputes match your filters' : 'No Disputes Found'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {filterCount > 0
                    ? 'Try adjusting your filter criteria'
                    : 'Your disputes will appear here'}
                </Text>
                {filterCount > 0 && (
                  <TouchableOpacity
                    style={styles.clearFiltersBtn}
                    onPress={() => handleApplyFilters({
                      startDate: '',
                      endDate: '',
                      brand: '',
                      model: '',
                      year: '',
                      vehicleNumber: '',
                      assignedTo: '',
                      addedBy: '',
                      sortBy: null,
                    })}
                    activeOpacity={0.8}>
                    <Text style={styles.clearFiltersBtnText}>Clear Filters</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              filteredDisputes.map(dispute => (
                <DisputeCard
                  key={dispute.id}
                  dispute={dispute}
                  onEdit={id => console.log('Edit dispute:', id)}
                  onAccept={id => console.log('Accept dispute:', id)}
                  onView={id => console.log('View dispute:', id)}
                  onChat={id => console.log('Chat dispute:', id)}
                />
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* ── Filters Overlay ───────────────────────────────────────────── */}
      <FiltersOverlay
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        onApply={handleApplyFilters}
      />

      {/* ── Floating Action Button ───────────────────────────────────── */}
      <FloatingActionButton
        navigationOptions={[
          {label: 'Request Part', onPress: handleRequestPart},
          {label: 'Raise Dispute', onPress: handleRaiseDispute},
        ]}
      />

      {/* ── Vehicle Selection Overlay ─────────────────────────────────── */}
      <VehicleSelectionOverlay
        isOpen={showVehicleSelection}
        onClose={() => setShowVehicleSelection(false)}
        onVehicleSelected={handleVehicleSelected}
        title={
          targetOverlay === 'requestPart'
            ? 'Select Vehicle for Request Part'
            : 'Select Vehicle for Dispute'
        }
      />

      {/* ── Request Part Overlay ──────────────────────────────────────── */}
      {vehicleInfo && (
        <RequestPartOverlay
          isOpen={showRequestPart}
          onClose={() => setShowRequestPart(false)}
          onSubmit={handleRequestPartSubmit}
        />
      )}

      {/* ── Raise Dispute Overlay ─────────────────────────────────────── */}
      {vehicleInfo && selectedVehicle && (
        <RaiseDisputeOverlay
          isOpen={showRaiseDispute}
          onClose={() => setShowRaiseDispute(false)}
          onConfirm={handleDisputeConfirm}
          orders={vehicleOrders}
          buttonText="SEND REQUEST"
          vehicleInfo={vehicleInfo}
          onChatWithUs={() => {
            console.log('Chat with us clicked');
          }}
        />
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#ffffff'},

  scrollContent: {
    paddingHorizontal: 16,
  },

  // Title section
  titleSection: {
    marginBottom: 24,
    marginTop: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 14,
    color: '#828282',
    marginTop: 4,
  },

  // Tab toggle row
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  tabToggle: {
    flexDirection: 'row',
    backgroundColor: '#e5e5e5',
    borderRadius: 12,
    padding: 3,
  },
  tabBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9,
  },
  tabBtnActive: {backgroundColor: '#e5383b'},
  tabBtnText: {fontSize: 13, fontWeight: '500', color: '#4c4c4c'},
  tabBtnTextActive: {color: '#ffffff'},

  // Filter button
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e5383b',
    borderRadius: 8,
    position: 'relative',
  },
  filterBtnText: {fontSize: 13, fontWeight: '500', color: '#e5383b'},
  filterBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#e5383b',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },

  // Card list
  cardList: {gap: 16},

  // State cards (loading / empty)
  stateCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {fontSize: 14, color: '#99a2b6'},
  emptyTitle: {fontSize: 16, fontWeight: '500', color: '#2b2b2b'},
  emptySubtitle: {fontSize: 14, color: '#99a2b6', textAlign: 'center'},
  clearFiltersBtn: {
    backgroundColor: '#e5383b',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  clearFiltersBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
});
