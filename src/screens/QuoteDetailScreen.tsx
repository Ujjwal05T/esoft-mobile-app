import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Svg, {Path} from 'react-native-svg';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/RootNavigator';
import StatusBadge from '../components/ui/StatusBadge';
import {
  getQuoteById,
  updateQuoteStatus,
  type QuoteApiResponse,
} from '../services/api';
import AppAlert, {AlertState} from '../components/overlays/AppAlert';

type QuoteDetailRouteProp = RouteProp<RootStackParamList, 'QuoteDetail'>;
type QuoteDetailNavProp = NativeStackNavigationProp<
  RootStackParamList,
  'QuoteDetail'
>;

const ArrowBackIcon = () => (
  <Svg width={23} height={18} viewBox="0 0 23 18" fill="none">
    <Path
      d="M9 17L1 9M1 9L9 1M1 9H22"
      stroke="#000"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const CheckIcon = () => (
  <Svg width={12} height={9} viewBox="0 0 12 9" fill="none">
    <Path
      d="M1 4L4.5 7.5L11 1"
      stroke="white"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default function QuoteDetailScreen() {
  const navigation = useNavigation<QuoteDetailNavProp>();
  const route = useRoute<QuoteDetailRouteProp>();
  const {quoteId} = route.params;

  const [quote, setQuote] = useState<QuoteApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [declining, setDeclining] = useState(false);
  const [appAlert, setAppAlert] = useState<AlertState | null>(null);

  useEffect(() => {
    async function fetchQuote() {
      try {
        setLoading(true);
        const result = await getQuoteById(quoteId);
        if (result.success && result.data) {
          setQuote(result.data);
          const availableIds = new Set(
            result.data.items
              .filter(i => i.availability === 'in_stock')
              .map(i => i.id),
          );
          setSelectedItems(availableIds);
        }
      } catch (e) {
        console.error('Failed to fetch quote:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchQuote();
  }, [quoteId]);

  const handleDecline = useCallback(async () => {
    if (!quote) return;
    setAppAlert({
      type: 'confirm',
      title: 'Decline Quote',
      message: 'Are you sure you want to decline this quote?',
      confirmText: 'Decline',
      onConfirm: () => {
        (async () => {
          try {
            setDeclining(true);
            const result = await updateQuoteStatus(quote.id, 'rejected');
            if (result.success) {
              const refreshed = await getQuoteById(quote.id);
              if (refreshed.success && refreshed.data) {
                setQuote(refreshed.data);
              }
            } else {
              setAppAlert({type: 'error', message: 'Failed to decline quote. Please try again.'});
            }
          } catch {
            setAppAlert({type: 'error', message: 'Something went wrong. Please try again.'});
          } finally {
            setDeclining(false);
          }
        })();
      },
    });
  }, [quote]);

  const toggleItem = (itemId: number) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  // ── Derived state ─────────────────────────────────────────
  const isExpired = quote?.expiresAt
    ? new Date(quote.expiresAt) < new Date()
    : false;
  const isAccepted = quote?.status === 'approved';
  const isDeclined = quote?.status === 'rejected';

  const availableItems =
    quote?.items.filter(i => i.availability === 'in_stock') || [];
  const unavailableItems =
    quote?.items.filter(i => i.availability !== 'in_stock') || [];

  const partsSubtotal =
    quote?.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0) ||
    0;
  const additionalCharges = quote
    ? quote.packingCharges + quote.forwardingCharges + quote.shippingCharges
    : 0;
  const grandTotal = quote?.totalAmount || 0;

  const deliveryByDate = quote?.items.reduce<string | null>((max, item) => {
    if (!item.estimatedDelivery) return max;
    if (!max || new Date(item.estimatedDelivery) > new Date(max))
      return item.estimatedDelivery;
    return max;
  }, null);

  const getExpiresInText = () => {
    if (!quote?.expiresAt) return null;
    const diff = new Date(quote.expiresAt).getTime() - Date.now();
    if (diff <= 0) return null;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    return hours < 24 ? `${hours} hours` : `${Math.floor(hours / 24)} days`;
  };

  const formatPrice = (price: number) => `Rs. ${Math.round(price)}`;

  const formatShortDate = (date: string) =>
    new Date(date)
      .toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
      .toLowerCase();

  const formatDeliveryDate = (date: string | null) => {
    if (!date) return '-';
    const d = new Date(date);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const getBadgeStatus = () => {
    if (isExpired) return 'expired' as const;
    if (quote?.status === 'approved') return 'approved' as const;
    if (quote?.status === 'rejected') return 'declined' as const;
    return 'pending_review' as const;
  };

  // ── Loading ────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#e5383b" />
        <Text style={styles.loadingText}>Loading quote details...</Text>
      </SafeAreaView>
    );
  }

  if (!quote) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.notFoundTitle}>Quote Not Found</Text>
        <Text style={styles.notFoundDesc}>
          The quote you&apos;re looking for doesn&apos;t exist.
        </Text>
        <TouchableOpacity
          style={styles.goBackBtn}
          onPress={() => navigation.goBack()}>
          <Text style={styles.goBackBtnText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const expiresInText = getExpiresInText();

  return (
    <SafeAreaView style={styles.root}>
      {/* ── Header ─────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
          style={styles.backBtn}>
          <ArrowBackIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quote Details</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* ════════════════════════════════════════
            QUOTE INFO CARD
            ════════════════════════════════════════ */}
        <View style={styles.infoCard}>
          {/* Top row */}
          <View style={styles.infoTopRow}>
            <View style={styles.infoLeft}>
              <Text style={styles.vehicleName}>{quote.vehicleName}</Text>
              <Text style={styles.plateNumber}>{quote.plateNumber}</Text>
              <Text style={styles.quoteNumber}>{quote.quoteNumber}</Text>
              <Text style={styles.dateText}>
                {isExpired
                  ? `expired: ${formatShortDate(quote.expiresAt!)}`
                  : `Submitted: ${formatShortDate(quote.createdAt)}`}
              </Text>
            </View>
            <View style={styles.infoRight}>
              <StatusBadge status={getBadgeStatus()} />
              {!isExpired && expiresInText && (
                <Text style={styles.expiresText}>
                  Expires in{' '}
                  <Text style={styles.expiresValue}>{expiresInText}</Text>
                </Text>
              )}
            </View>
          </View>

          <View style={styles.divider} />

          {/* Expired summary */}
          {isExpired && (
            <View style={styles.expiredRow}>
              <Text style={styles.expiredMsg}>
                The quote is expired. Kindly re-request for current availability
                and prices
              </Text>
              <View style={styles.totalCol}>
                <Text style={styles.summaryLabel}>Grand Total</Text>
                <Text style={styles.summaryValue}>{formatPrice(grandTotal)}</Text>
              </View>
            </View>
          )}

          {/* Active financial summary */}
          {!isExpired && (
            <>
              <View style={styles.summaryRow}>
                <View>
                  <Text style={styles.summaryLabel}>Delivery by:</Text>
                  <Text style={styles.summaryValue}>
                    {formatShortDate(deliveryByDate || quote.createdAt)}
                  </Text>
                </View>
                <View>
                  <Text style={styles.summaryLabel}>Parts Subtotal</Text>
                  <Text style={styles.summaryValue}>
                    {formatPrice(partsSubtotal)}
                  </Text>
                </View>
              </View>
              <View style={styles.summaryRow}>
                <View style={styles.flex1}>
                  <Text style={styles.summaryLabel}>
                    Additional Charges (Shipping and Labor)
                  </Text>
                  <Text style={styles.summaryValue}>
                    {formatPrice(additionalCharges)}
                  </Text>
                </View>
                <View style={styles.totalCol}>
                  <Text style={styles.summaryLabel}>Grand Total</Text>
                  <Text style={styles.summaryValue}>
                    {formatPrice(grandTotal)}
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* ════════════════════════════════════════
            ITEMS LIST
            ════════════════════════════════════════ */}
        <View style={styles.itemsList}>
          {/* Active: available items with checkboxes */}
          {!isExpired &&
            availableItems.map(item => (
              <TouchableOpacity
                key={item.id}
                onPress={() => toggleItem(item.id)}
                activeOpacity={0.8}
                style={styles.itemCard}>
                {/* Checkbox */}
                <View
                  style={[
                    styles.checkbox,
                    selectedItems.has(item.id) && styles.checkboxSelected,
                  ]}>
                  {selectedItems.has(item.id) && <CheckIcon />}
                </View>

                {/* Content */}
                <View style={styles.itemContent}>
                  {/* Brand + Available badge */}
                  <View style={styles.badgeRow}>
                    {item.brand ? (
                      <View style={styles.brandBadge}>
                        <Text style={styles.brandText}>{item.brand}</Text>
                      </View>
                    ) : (
                      <View />
                    )}
                    <View style={styles.availableBadge}>
                      <Text style={styles.availableText}>Available</Text>
                    </View>
                  </View>

                  {/* Part name + price */}
                  <View style={styles.partRow}>
                    <Text style={styles.partName}>{item.partName}</Text>
                    <Text style={styles.partPrice}>
                      {formatPrice(item.unitPrice)}
                    </Text>
                  </View>

                  {/* Delivery + qty */}
                  <View style={styles.metaRow}>
                    <Text style={styles.metaText}>
                      Exp. Delivery{' '}
                      {formatDeliveryDate(item.estimatedDelivery)}
                    </Text>
                    <Text style={styles.metaText}>
                      {item.quantity} of {item.quantity} pcs
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}

          {/* Active: unavailable items */}
          {!isExpired &&
            unavailableItems.map(item => (
              <View key={item.id} style={styles.itemCard}>
                {/* Checkbox (disabled) */}
                <View style={styles.checkboxDisabled} />

                {/* Content */}
                <View style={styles.itemContent}>
                  {/* Part name + unavailable badge */}
                  <View style={styles.partRow}>
                    <Text style={styles.partName}>{item.partName}</Text>
                    <View style={styles.unavailableBadge}>
                      <Text style={styles.unavailableText}>Unavailable</Text>
                    </View>
                  </View>

                  {/* Delivery + qty */}
                  <View style={styles.metaRow}>
                    <Text style={styles.metaText}>
                      Exp. Arrival by{' '}
                      {formatDeliveryDate(item.estimatedDelivery)}
                    </Text>
                    <Text style={styles.metaText}>
                      0 of {item.quantity} pcs
                    </Text>
                  </View>
                </View>
              </View>
            ))}

          {/* Expired: all items grayed */}
          {isExpired &&
            quote.items.map(item => (
              <View key={item.id} style={styles.itemCard}>
                <View style={styles.checkboxExpired} />
                <View style={styles.itemContent}>
                  <View style={styles.badgeRow}>
                    {item.brand ? (
                      <View style={styles.brandBadge}>
                        <Text style={styles.brandText}>{item.brand}</Text>
                      </View>
                    ) : (
                      <View />
                    )}
                    <Text style={styles.metaText}>
                      {item.quantity} of {item.quantity} pcs
                    </Text>
                  </View>
                  <View style={styles.partRow}>
                    <Text style={styles.partName}>{item.partName}</Text>
                    <Text style={[styles.partPrice, styles.partPriceGray]}>
                      {formatPrice(item.unitPrice)}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
        </View>

        {/* bottom padding for CTA bar */}
        <View style={{height: 100}} />
      </ScrollView>

      {/* ════════════════════════════════════════
          BOTTOM CTA BAR
          ════════════════════════════════════════ */}
      <View style={styles.ctaBar}>
        {isExpired ? (
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => console.log('Re-request quote:', quote.id)}
            activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>RE-REQUEST</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={[
                styles.approveBtn,
                (isAccepted || isDeclined) && styles.approveBtnDisabled,
              ]}
              disabled={isAccepted || isDeclined}
              onPress={() =>
                navigation.navigate('Payment', {quoteId: quote.id})
              }
              activeOpacity={0.85}>
              <Text style={styles.approveBtnText}>
                {isAccepted
                  ? 'ORDER PLACED'
                  : isDeclined
                  ? 'DECLINED'
                  : 'APPROVE AND PAY'}
              </Text>
            </TouchableOpacity>

            {!isAccepted && !isDeclined && (
              <TouchableOpacity
                style={styles.declineBtn}
                onPress={handleDecline}
                disabled={declining}
                activeOpacity={0.85}>
                {declining ? (
                  <ActivityIndicator size="small" color="#e5383b" />
                ) : (
                  <Text style={styles.declineBtnText}>DECLINE</Text>
                )}
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
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

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#f5f5f5'},
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  notFoundTitle: {fontSize: 20, fontWeight: '600', color: '#333', marginBottom: 8},
  notFoundDesc: {fontSize: 14, color: '#666', marginBottom: 24, textAlign: 'center'},
  goBackBtn: {
    backgroundColor: '#e5383b',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  goBackBtnText: {color: '#fff', fontWeight: '600', fontSize: 15},

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {padding: 4},
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#e5383b',
  },
  headerRight: {width: 31},

  scroll: {flex: 1},
  scrollContent: {padding: 16},

  // Quote info card
  infoCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d3d3d3',
    borderRadius: 10,
    padding: 16,
    gap: 16,
  },
  infoTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  infoLeft: {flex: 1, gap: 4},
  vehicleName: {fontSize: 14, fontWeight: '600', color: '#4c4c4c'},
  plateNumber: {fontSize: 17, fontWeight: '700', color: '#e5383b'},
  quoteNumber: {fontSize: 14, fontWeight: '700', color: '#e8353b'},
  dateText: {fontSize: 12, fontWeight: '500', color: '#828282'},
  infoRight: {
    alignItems: 'flex-end',
    gap: 5,
    flexShrink: 0,
  },
  expiresText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#000',
    textAlign: 'center',
    letterSpacing: -0.41,
  },
  expiresValue: {fontWeight: '700', color: '#e5383b'},

  divider: {height: 1, backgroundColor: '#dadada'},

  // Expired row
  expiredRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 28,
  },
  expiredMsg: {
    fontSize: 11,
    fontWeight: '500',
    color: '#e5383b',
    flex: 1,
  },

  // Financial summary
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  summaryLabel: {fontSize: 11, fontWeight: '500', color: '#000'},
  summaryValue: {fontSize: 14, fontWeight: '700', color: '#e5383b', marginTop: 4},
  totalCol: {width: 75},
  flex1: {flex: 1},

  // Items list
  itemsList: {marginTop: 8, gap: 5},
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  // Checkboxes
  checkbox: {
    width: 19,
    height: 18,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#e5383b',
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {backgroundColor: '#e5383b'},
  checkboxDisabled: {
    width: 19,
    height: 18,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#b1a7a6',
    flexShrink: 0,
  },
  checkboxExpired: {
    width: 19,
    height: 18,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#e5383b',
    flexShrink: 0,
  },

  // Item content
  itemContent: {flex: 1, gap: 10},
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandBadge: {
    backgroundColor: '#e4e4e4',
    borderRadius: 7,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  brandText: {fontSize: 12, fontWeight: '500', color: '#000', letterSpacing: -0.41},
  availableBadge: {
    backgroundColor: '#289d27',
    borderRadius: 7,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  availableText: {fontSize: 12, fontWeight: '500', color: '#fff', letterSpacing: -0.41},
  unavailableBadge: {
    backgroundColor: '#e5383b',
    borderRadius: 7,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  unavailableText: {fontSize: 12, fontWeight: '500', color: '#fff', letterSpacing: -0.41},

  partRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  partName: {fontSize: 14, fontWeight: '700', color: '#323232', flex: 1},
  partPrice: {fontSize: 14, fontWeight: '700', color: '#000'},
  partPriceGray: {color: '#b1a7a6'},

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaText: {fontSize: 12, fontWeight: '500', color: '#939393'},

  // CTA Bar
  ctaBar: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    flexDirection: 'row',
    gap: 13,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  primaryBtn: {
    flex: 1,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#e5383b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: -0.01,
  },
  approveBtn: {
    flex: 1,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#e5383b',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e5383b',
  },
  approveBtnDisabled: {
    backgroundColor: '#828282',
    borderColor: '#828282',
  },
  approveBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: -0.01,
  },
  declineBtn: {
    flex: 1,
    height: 56,
    borderRadius: 8,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#e5383b',
    textTransform: 'uppercase',
    letterSpacing: -0.01,
  },
});
