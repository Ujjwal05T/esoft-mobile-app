import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
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
import FiltersOverlay from '../components/overlays/FiltersOverlay';
import {
  getStoredUser,
  getInquiriesByWorkshopOwnerId,
  getQuotesByWorkshopOwnerId,
  type InquiryResponse,
  type QuoteApiResponse,
} from '../services/api';

// ── Types ─────────────────────────────────────────────────────────────────────

type ActiveTab = 'inquiries' | 'quotes' | 'disputes';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function mapApiInquiry(api: InquiryResponse): Inquiry {
  return {
    id: api.inquiryNumber,
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
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loadingInquiries, setLoadingInquiries] = useState(false);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [expandedInquiryId, setExpandedInquiryId] = useState<string | null>(null);
  const [expandedQuoteId, setExpandedQuoteId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // ── Data Fetching ───────────────────────────────────────────────────────────

  const fetchInquiries = useCallback(async () => {
    setLoadingInquiries(true);
    try {
      const user = await getStoredUser();
      if (!user) return;
      const res = await getInquiriesByWorkshopOwnerId(user.id);
      if (res.success && res.data) {
        setInquiries(res.data.inquiries.map(mapApiInquiry));
      }
    } catch (e) {
      console.error('Failed to fetch inquiries:', e);
    } finally {
      setLoadingInquiries(false);
    }
  }, []);

  const fetchQuotes = useCallback(async () => {
    setLoadingQuotes(true);
    try {
      const user = await getStoredUser();
      if (!user) return;
      const res = await getQuotesByWorkshopOwnerId(user.id);
      if (res.success && res.data) {
        setQuotes(res.data.quotes.map(mapApiQuote));
      }
    } catch (e) {
      console.error('Failed to fetch quotes:', e);
    } finally {
      setLoadingQuotes(false);
    }
  }, []);

  useEffect(() => {
    fetchInquiries();
    fetchQuotes();
  }, [fetchInquiries, fetchQuotes]);

  // ── Handlers ────────────────────────────────────────────────────────────────

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
            ) : inquiries.length === 0 ? (
              <View style={styles.stateCard}>
                <Text style={styles.emptyTitle}>No Inquiries Found</Text>
                <Text style={styles.emptySubtitle}>
                  Your inquiries will appear here
                </Text>
              </View>
            ) : (
              inquiries.map(inquiry => (
                <InquiryCard
                  key={inquiry.id}
                  inquiry={inquiry}
                  isExpanded={expandedInquiryId === inquiry.id}
                  onToggle={() =>
                    setExpandedInquiryId(
                      expandedInquiryId === inquiry.id ? null : inquiry.id,
                    )
                  }
                  onEdit={id => console.log('Edit inquiry:', id)}
                  onView={id => console.log('View inquiry:', id)}
                  onApprove={id => console.log('Approve inquiry:', id)}
                  onReRequest={id => console.log('Re-request inquiry:', id)}
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
            ) : quotes.length === 0 ? (
              <View style={styles.stateCard}>
                <Text style={styles.emptyTitle}>No Quotes Found</Text>
                <Text style={styles.emptySubtitle}>
                  Your quotes will appear here
                </Text>
              </View>
            ) : (
              quotes.map(quote => (
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
            <View style={styles.stateCard}>
              <Text style={styles.emptyTitle}>No Disputes Found</Text>
              <Text style={styles.emptySubtitle}>
                Your disputes will appear here
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── Filters Overlay ───────────────────────────────────────────── */}
      <FiltersOverlay
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        onApply={filters => {
          console.log('Filters applied:', filters);
          setShowFilters(false);
        }}
      />
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
  },
  filterBtnText: {fontSize: 13, fontWeight: '500', color: '#e5383b'},

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
});
