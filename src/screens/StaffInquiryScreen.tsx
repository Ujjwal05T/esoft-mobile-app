import React, {useState, useEffect, useCallback} from 'react';
import {useTranslation} from 'react-i18next';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/RootNavigator';
import Svg, {Path} from 'react-native-svg';
import InquiryCard, {
  Inquiry,
} from '../components/dashboard/InquiryCard';
import DisputeCard, {Dispute} from '../components/dashboard/DisputeCard';
import FloatingActionButton from '../components/dashboard/FloatingActionButton';
import FiltersOverlay, {FilterData} from '../components/overlays/FiltersOverlay';
import VehicleSelectionOverlay, {
  type VehicleInfo,
} from '../components/overlays/VehicleSelectionOverlay';
import VehicleTypeSelectionOverlay from '../components/overlays/VehicleTypeSelectionOverlay';
import AddVehicleOverlay from '../components/overlays/AddVehicleOverlay';
import RequestPartOverlay from '../components/overlays/RequestPartOverlay';
import RaiseDisputeOverlay from '../components/overlays/RaiseDisputeOverlay';
import type {DisputeFormData} from '../components/overlays/RaiseDisputeOverlay';
import DisputeCommentsOverlay from '../components/overlays/DisputeCommentsOverlay';
import AppAlert, {AlertState} from '../components/overlays/AppAlert';
import EditInquiryOverlay from '../components/overlays/EditInquiryOverlay';
import {formatDateIST} from '../utils/dateUtils';
import {
  getStoredUser,
  getInquiriesByStaffId,
  getDisputesByRaisedById,
  getOrdersByVehicleId,
  getOrderById,
  createInquiry,
  createInquiryWithMedia,
  createDisputeWithFiles,
  getStaffProfile,
  getJobCardsByVehicle,
  getInquiryById,
  type InquiryResponse,
  type InquiryItemResponse,
  type DisputeListItemResponse,
  type VehicleResponse,
  type WorkshopOrderListItem,
  type InquiryItemRequest,
  type StaffPermissions,
} from '../services/api';

// ── Types ─────────────────────────────────────────────────────────────────────

type ActiveTab = 'inquiries' | 'disputes';

// Extended types with rawDate for filtering
type InquiryWithDate = Inquiry & {rawDate?: string; numericId?: number};
type DisputeWithDate = Dispute & {rawDate?: string; numericId?: number; partName?: string; remark?: string; orderNumber?: string};

// ── Helpers ───────────────────────────────────────────────────────────────────

function mapApiInquiry(api: InquiryResponse): InquiryWithDate {
  return {
    id: api.inquiryNumber,
    numericId: api.id,
    vehicleName: api.vehicleName ?? '',
    numberPlate: api.numberPlate ?? '',
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
      imageUrl: item.image1Url ?? undefined,
    })),
    media: [],
    rawDate: api.placedDate,
  };
}

function mapApiDispute(api: DisputeListItemResponse): DisputeWithDate {
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
    action: isRequested ? 'edit' : 'chat',
    rawDate: api.date,
    partName: api.partName,
    remark: api.remark,
    orderNumber: api.orderNumber,
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

export default function StaffInquiryScreen() {
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [activeTab, setActiveTab] = useState<ActiveTab>('inquiries');
  const [inquiries, setInquiries] = useState<InquiryWithDate[]>([]);
  const [disputes, setDisputes] = useState<DisputeWithDate[]>([]);
  const [filteredInquiries, setFilteredInquiries] = useState<InquiryWithDate[]>([]);
  const [filteredDisputes, setFilteredDisputes] = useState<DisputeWithDate[]>([]);
  const [loadingInquiries, setLoadingInquiries] = useState(false);
  const [loadingDisputes, setLoadingDisputes] = useState(false);
  const [expandedInquiryId, setExpandedInquiryId] = useState<string | null>(null);
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

  const [permissions, setPermissions] = useState<StaffPermissions | null>(null);

  // Overlay states
  const [showVehicleTypeSelection, setShowVehicleTypeSelection] = useState(false);
  const [addVehicleForOrderParts, setAddVehicleForOrderParts] = useState(false);
  const [showVehicleSelection, setShowVehicleSelection] = useState(false);
  const [targetOverlay, setTargetOverlay] = useState<'requestPart' | 'raiseDispute' | null>(null);
  const [showRequestPart, setShowRequestPart] = useState(false);
  const [showRaiseDispute, setShowRaiseDispute] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleResponse | null>(null);
  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo | null>(null);
  const [activeVisitCategories, setActiveVisitCategories] = useState<string[]>([]);
  const [vehicleOrders, setVehicleOrders] = useState<any[]>([]);
  const [appAlert, setAppAlert] = useState<AlertState | null>(null);
  const [editInquiry, setEditInquiry] = useState<{id: number; items: InquiryItemResponse[]} | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [disputeCommentsId, setDisputeCommentsId] = useState<number | null>(null);
  const [editDisputeItem, setEditDisputeItem] = useState<DisputeWithDate | null>(null);

  const handleEditInquiry = async (numericId: number) => {
    const result = await getInquiryById(numericId);
    if (result.success && result.data) {
      setEditInquiry({id: numericId, items: result.data.items});
    }
  };

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
      const res = await getInquiriesByStaffId(user.id);
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

  const fetchDisputes = useCallback(async () => {
    setLoadingDisputes(true);
    try {
      const user = await getStoredUser();
      if (!user) return;
      const res = await getDisputesByRaisedById(user.id);
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

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchInquiries(), fetchDisputes()]);
    setRefreshing(false);
  }, [fetchInquiries, fetchDisputes]);

  useEffect(() => {
    fetchInquiries();
    fetchDisputes();
    getStaffProfile().then(res => {
      if (res.success && res.data) {
        setPermissions(res.data.permissions);
      }
    });
  }, [fetchInquiries, fetchDisputes]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleApplyFilters = (filters: FilterData) => {
    setActiveFilters(filters);
    setFilteredInquiries(applyInquiryFilters(inquiries, filters));
    setFilteredDisputes(applyDisputeFilters(disputes, filters));
    setShowFilters(false);
  };

  const getTitle = () => {
    switch (activeTab) {
      case 'disputes':  return t('inquiry.disputes_tab');
      default:          return t('inquiry.title');
    }
  };

  const filterCount = countActiveFilters(activeFilters);

  const handleReRequest = async (numericId: number) => {
    setAppAlert({
      type: 'confirm',
      title: t('inquiry.re_request_title'),
      message: t('inquiry.re_request_confirm'),
      onConfirm: () => {
        (async () => {
          try {
            const detail = await getInquiryById(numericId);
            if (!detail.success || !detail.data) {
              setAppAlert({type: 'error', message: t('inquiry.re_request_failed_msg')});
              return;
            }
            const inq = detail.data;
            const user = await getStoredUser();
            const staffProfileRes = await getStaffProfile();
            const workshopOwnerId = staffProfileRes.data?.workshopOwnerId ?? user?.id ?? 0;
            const result = await createInquiry({
              vehicleId: inq.vehicleId,
              vehicleVisitId: inq.vehicleVisitId ?? undefined,
              workshopOwnerId,
              requestedByStaffId: user?.id ?? null,
              jobCategories: inq.jobCategories,
              items: inq.items.map(item => ({
                partName: item.partName,
                preferredBrand: item.preferredBrand,
                quantity: item.quantity,
                remark: item.remark,
                audioUrl: item.audioUrl ?? undefined,
                audioDuration: item.audioDuration ?? undefined,
                image1Url: item.image1Url ?? undefined,
                image2Url: item.image2Url ?? undefined,
                image3Url: item.image3Url ?? undefined,
              })),
            });
            if (result.success) {
              setAppAlert({
                type: 'success',
                message: t('inquiry.re_request_success'),
                onDone: () => fetchInquiries(),
              });
            } else {
              setAppAlert({type: 'error', message: result.error || t('inquiry.re_request_failed_msg')});
            }
          } catch {
            setAppAlert({type: 'error', message: t('inquiry.re_request_failed_msg')});
          }
        })();
      },
    });
  };

  // ── FAB Handlers ────────────────────────────────────────────────────────────

  const handleRequestPart = () => {
    setTargetOverlay('requestPart');
    // Skip "New Vehicle" option if staff doesn't have addVehicle permission
    if (permissions !== null && !permissions.addVehicle) {
      setShowVehicleSelection(true);
    } else {
      setShowVehicleTypeSelection(true);
    }
  };

  const handleNewVehicleCreatedForOrderParts = async (vehicleId: number) => {
    setSelectedVehicle({id: vehicleId} as VehicleResponse);
    setActiveVisitCategories(['Default']);
    setAddVehicleForOrderParts(false);
    setShowRequestPart(true);
  };

  const handleRaiseDispute = () => {
    setTargetOverlay('raiseDispute');
    setShowVehicleSelection(true);
  };

  const handleVehicleSelected = async (vehicle: VehicleResponse, info: VehicleInfo) => {
    setSelectedVehicle(vehicle);
    setVehicleInfo(info);

    // Fetch job cards assigned to this staff for the selected vehicle
    const user = await getStoredUser();
    if (user) {
      const jobRes = await getJobCardsByVehicle(vehicle.id);
      if (jobRes.success && jobRes.data) {
        const categories = [
          ...new Set(
            jobRes.data.jobCards
              .filter(j => j.assignedStaffIds?.includes(user.id))
              .map(j => j.jobCategory)
              .filter(Boolean),
          ),
        ];
        setActiveVisitCategories(categories);
      }
    }

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
                date: formatDateIST(o.createdAt),
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
        setAppAlert({type: 'error', message: 'User or vehicle not found. Please try again.'});
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
          afterMarketBrandName: part.preferredBrand === 'After Market' ? part.afterMarketBrandName : undefined,
          quantity: parseInt(part.quantity, 10) || 1,
          remark: part.remark,
          audioDuration: part.audioDuration || undefined,
        };
      });

      const staffProfileRes = await getStaffProfile();
      const workshopOwnerId = staffProfileRes.data?.workshopOwnerId ?? user.id;

      const result = await createInquiryWithMedia(
        selectedVehicle.id,
        workshopOwnerId,
        activeVisitCategories,
        items,
        audioFiles,
        imageFiles,
        undefined,
        user.id,
      );

      if (result.success) {
        setAppAlert({type: 'success', message: `Inquiry created successfully!\n\nInquiry Number: ${result.data?.inquiryNumber || 'N/A'}`, onDone: () => { setShowRequestPart(false); fetchInquiries(); }});
      } else {
        setAppAlert({type: 'error', message: result.error || 'Failed to create inquiry'});
      }
    } catch (error) {
      console.error('Error creating inquiry:', error);
      setAppAlert({type: 'error', message: 'An error occurred while creating the inquiry'});
    }
  };

  const handleDisputeConfirm = async (formData: any) => {
    try {
      const user = await getStoredUser();
      if (!user) {
        setAppAlert({type: 'error', message: 'User not found. Please log in again.'});
        return;
      }

      const selectedOrder = vehicleOrders.find(
        o => o.orderId === formData.orderId,
      );

      if (!selectedOrder) {
        setAppAlert({type: 'error', message: 'Order not found'});
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

      const staffProfileRes = await getStaffProfile();
      const workshopOwnerId = staffProfileRes.data?.workshopOwnerId ?? user.id;

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

      if (result.success) {
        setAppAlert({type: 'success', message: 'Dispute created successfully', onDone: () => { setShowRaiseDispute(false); fetchDisputes(); }});
      } else {
        setAppAlert({type: 'error', message: result.error || 'Failed to create dispute'});
      }
    } catch (error) {
      console.error('Error creating dispute:', error);
      setAppAlert({type: 'error', message: 'An error occurred while creating the dispute'});
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
      fetchDisputes();
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={[styles.container]}>
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

        {/* ── Page Title ───────────────────────────────────────────────── */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>{getTitle()}</Text>
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
                {t('inquiry.title')}
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
                {t('inquiry.disputes_tab')}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => setShowFilters(true)}
            activeOpacity={0.8}>
            <FilterIcon />
            <Text style={styles.filterBtnText}>{t('screen.filter')}</Text>
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
                <Text style={styles.loadingText}>{t('inquiry.loading')}</Text>
              </View>
            ) : filteredInquiries.length === 0 ? (
              <View style={styles.stateCard}>
                <Text style={styles.emptyTitle}>
                  {filterCount > 0 ? t('inquiry.no_inquiries_filters') : t('common.no_data')}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {filterCount > 0 ? t('screen.try_adjusting_filters') : t('inquiry.your_inquiries')}
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
                    <Text style={styles.clearFiltersBtnText}>{t('screen.clear_filters')}</Text>
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
                  onEdit={() => { if (inquiry.numericId) handleEditInquiry(inquiry.numericId); }}
                  onView={() => {
                    // Navigate to inquiry detail screen using numeric ID
                    if (inquiry.numericId) {
                      navigation.navigate('InquiryDetail', {inquiryId: inquiry.numericId});
                    }
                  }}
                  onReRequest={() => { if (inquiry.numericId) handleReRequest(inquiry.numericId); }}
                  showNumberPlate={true}
                  isOwner={false}
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
                <Text style={styles.loadingText}>{t('inquiry.loading_disputes')}</Text>
              </View>
            ) : filteredDisputes.length === 0 ? (
              <View style={styles.stateCard}>
                <Text style={styles.emptyTitle}>
                  {filterCount > 0 ? t('inquiry.no_disputes_filters') : t('inquiry.no_disputes')}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {filterCount > 0 ? t('screen.try_adjusting_filters') : t('inquiry.your_disputes')}
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
                    <Text style={styles.clearFiltersBtnText}>{t('screen.clear_filters')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              filteredDisputes.map(dispute => (
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
        onVehicleSelected={vehicleId => {
          setShowFilters(false);
          navigation.navigate('StaffVehicleDetail', {vehicleId});
        }}
      />

      {/* ── Dispute Comments Overlay ─────────────────────────────────── */}
      <DisputeCommentsOverlay
        isOpen={disputeCommentsId !== null}
        onClose={() => setDisputeCommentsId(null)}
        disputeId={disputeCommentsId ?? 0}
      />

      {/* ── Edit Requested Dispute Overlay ───────────────────────────── */}
      <RaiseDisputeOverlay
        isOpen={editDisputeItem !== null}
        onClose={() => setEditDisputeItem(null)}
        onConfirm={handleDisputeEditConfirm}
        buttonText={t('inquiry.send_request_btn')}
        initialOrderId={editDisputeItem?.orderNumber}
        initialOrderDisplay={editDisputeItem?.orderNumber}
        initialPartName={editDisputeItem?.partName}
        initialReason={editDisputeItem?.disputeRaised}
        initialRemark={editDisputeItem?.remark}
      />

      {/* ── Floating Action Button ───────────────────────────────────── */}
      <FloatingActionButton
        navigationOptions={[
          {
            label: t('inquiry.request_part'),
            onPress: handleRequestPart,
            disabled: permissions !== null && !permissions.createInquiry,
          },
          {
            label: t('inquiry.raise_dispute_btn'),
            onPress: handleRaiseDispute,
            disabled: permissions !== null && !permissions.raiseDispute,
          },
        ]}
      />

      {/* ── Vehicle Type Selection Overlay ───────────────────────────── */}
      <VehicleTypeSelectionOverlay
        isOpen={showVehicleTypeSelection}
        onClose={() => setShowVehicleTypeSelection(false)}
        onSelectExisting={() => {
          setShowVehicleTypeSelection(false);
          setShowVehicleSelection(true);
        }}
        onSelectNew={() => {
          setShowVehicleTypeSelection(false);
          setAddVehicleForOrderParts(true);
        }}
      />

      {/* ── Add Vehicle Overlay (for order parts) ────────────────────── */}
      <AddVehicleOverlay
        isOpen={addVehicleForOrderParts}
        onClose={() => setAddVehicleForOrderParts(false)}
        onVehicleCreated={handleNewVehicleCreatedForOrderParts}
      />

      {/* ── Vehicle Selection Overlay ─────────────────────────────────── */}
      <VehicleSelectionOverlay
        isOpen={showVehicleSelection}
        onClose={() => setShowVehicleSelection(false)}
        onVehicleSelected={handleVehicleSelected}
        title={
          targetOverlay === 'requestPart'
            ? t('inquiry.select_vehicle_parts')
            : t('inquiry.select_vehicle_dispute')
        }
      />

      {/* ── Request Part Overlay ──────────────────────────────────────── */}
      {selectedVehicle && (
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
          buttonText={t('inquiry.send_request_btn')}
          vehicleInfo={vehicleInfo}
        />
      )}

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
  container: {flex: 1, backgroundColor: '#ffffff'},

  scrollContent: {
    paddingHorizontal: 16,
  },

  // Title section
  titleSection: {
    marginBottom: 14,
    marginTop: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
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
