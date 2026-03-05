import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Svg, {Path} from 'react-native-svg';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/RootNavigator';
import StatusBadge from '../components/ui/StatusBadge';
import {
  getQuoteById,
  createPaymentOrder,
  verifyPayment,
  type QuoteApiResponse,
} from '../services/api';

// SVG payment icons from assets
import UpiIcon from '../assets/icons/upi.svg';
import PhonePeIcon from '../assets/icons/phonepe.svg';
import GPayIcon from '../assets/icons/gpay.svg';
import PaytmIcon from '../assets/icons/paytm.svg';
import BankIcon from '../assets/icons/Bank.svg';

import RazorpayCheckout, {type RazorpayOptions} from 'react-native-razorpay';
import creditCardImg from '../assets/icons/Credit-Card.png';
import AppAlert, {AlertState} from '../components/overlays/AppAlert';

type PaymentRouteProp = RouteProp<RootStackParamList, 'Payment'>;
type PaymentNavProp = NativeStackNavigationProp<RootStackParamList, 'Payment'>;

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

export default function PaymentScreen() {
  const navigation = useNavigation<PaymentNavProp>();
  const route = useRoute<PaymentRouteProp>();
  const {quoteId} = route.params;

  const [quote, setQuote] = useState<QuoteApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [appAlert, setAppAlert] = useState<AlertState | null>(null);

  useEffect(() => {
    async function fetchQuote() {
      try {
        setLoading(true);
        const result = await getQuoteById(quoteId);
        if (result.success && result.data) {
          setQuote(result.data);
        }
      } catch (e) {
        console.error('Failed to fetch quote:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchQuote();
  }, [quoteId]);

  const formatPrice = (amount: number) =>
    `Rs. ${amount.toLocaleString('en-IN')}`;

  const additionalCharges = quote
    ? (quote.packingCharges || 0) +
      (quote.forwardingCharges || 0) +
      (quote.shippingCharges || 0)
    : 0;

  const partsSubtotal = quote ? quote.totalAmount - additionalCharges : 0;

  const getExpiresLabel = () => {
    if (!quote?.expiresAt) return null;
    const diffMs = new Date(quote.expiresAt).getTime() - Date.now();
    if (diffMs <= 0) return 'Expired';
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
    if (diffHours <= 24) return `${diffHours} hours`;
    return `${Math.ceil(diffMs / (1000 * 60 * 60 * 24))} days`;
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr)
      .toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
      .toLowerCase();

  const handlePay = useCallback(
    async (method: string) => {
      if (!quote || paymentLoading) return;

      if (!RazorpayCheckout) {
        console.error('[Payment] RazorpayCheckout module not found');
        setAppAlert({type: 'warning', title: 'Payment Unavailable', message: 'Payment gateway is not configured. Please contact support.'});
        return;
      }

      try {
        setPaymentLoading(true);
        setSelectedMethod(method);

        console.log('[Payment] Creating order for quote:', quote.id, 'method:', method);
        const orderResult = await createPaymentOrder(quote.id);
        console.log('[Payment] Order result:', JSON.stringify(orderResult));

        if (!orderResult.success || !orderResult.data) {
          console.error('[Payment] Order creation failed:', orderResult);
          setAppAlert({type: 'error', message: 'Failed to create payment order. Please try again.'});
          setPaymentLoading(false);
          return;
        }

        const {orderId, amount, currency, keyId} = orderResult.data;
        console.log('[Payment] Order created:', {orderId, amount, currency, keyId});

        const options: RazorpayOptions = {
          description: `Payment for ${quote.quoteNumber}`,
          currency,
          key: keyId,
          amount,
          name: 'ETNA Parts',
          order_id: orderId,
          prefill: {
            name: quote.workshopName || '',
          },
          theme: {color: '#e5383b'},
          method,
        };

        console.log('[Payment] Opening Razorpay with options:', JSON.stringify(options));
        const data = await RazorpayCheckout.open(options);
        console.log('[Payment] Razorpay success response:', JSON.stringify(data));

        console.log('[Payment] Verifying payment...');
        const verifyResult = await verifyPayment({
          quoteId: quote.id,
          razorpayOrderId: data.razorpay_order_id,
          razorpayPaymentId: data.razorpay_payment_id,
          razorpaySignature: data.razorpay_signature,
        });
        console.log('[Payment] Verify result:', JSON.stringify(verifyResult));

        if (verifyResult.success) {
          setAppAlert({type: 'success', message: 'Payment successful! Your order has been placed.', onDone: () => navigation.navigate('QuoteDetail', {quoteId: quote.id})});
        } else {
          console.error('[Payment] Verification failed:', verifyResult);
          setAppAlert({type: 'error', message: 'Payment verification failed. Please contact support.'});
        }
      } catch (error: unknown) {
        // Razorpay errors are objects with code + description — JSON.stringify gives {}
        // so log each field manually
        const rzpError = error as {code?: number; description?: string; source?: string; step?: string; reason?: string};
        console.error('[Payment] Caught error — code:', rzpError?.code);
        console.error('[Payment] Caught error — description:', rzpError?.description);
        console.error('[Payment] Caught error — source:', rzpError?.source);
        console.error('[Payment] Caught error — step:', rzpError?.step);
        console.error('[Payment] Caught error — reason:', rzpError?.reason);
        console.error('[Payment] Raw error (toString):', String(error));

        // code 0 = user dismissed the modal, not a real error
        if (rzpError?.code !== 0) {
          setAppAlert({type: 'error', title: 'Payment Failed', message: `${rzpError?.description || 'Payment was not completed.'} (code: ${rzpError?.code})`});
        } else {
          console.log('[Payment] User dismissed the payment modal');
        }
      } finally {
        setPaymentLoading(false);
        setSelectedMethod(null);
      }
    },
    [quote, paymentLoading, navigation],
  );

  // ── Loading ─────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#e5383b" />
        <Text style={styles.loadingText}>Loading payment details...</Text>
      </SafeAreaView>
    );
  }

  if (!quote) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.notFoundText}>Quote not found</Text>
      </SafeAreaView>
    );
  }

  const expiresLabel = getExpiresLabel();

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      {/* ── Header ─────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
          style={styles.backBtn}>
          <ArrowBackIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* ════════════════════════════════════════
            QUOTE SUMMARY CARD
            ════════════════════════════════════════ */}
        <View style={styles.summaryCard}>
          {/* Top row: vehicle info + status */}
          <View style={styles.summaryTopRow}>
            <View style={styles.summaryLeft}>
              {quote.vehicleName && (
                <>
                  <Text style={styles.vehicleName}>{quote.vehicleName}</Text>
                  {quote.plateNumber && (
                    <Text style={styles.plateNumber}>{quote.plateNumber}</Text>
                  )}
                </>
              )}
              <Text style={styles.quoteNumber}>{quote.quoteNumber}</Text>
              <Text style={styles.dateText}>
                Submitted: {formatDate(quote.createdAt)}
              </Text>
            </View>
            <View style={styles.summaryRight}>
              <StatusBadge
                status={
                  quote.status === 'approved'
                    ? 'approved'
                    : quote.status === 'rejected'
                    ? 'declined'
                    : 'pending_review'
                }
              />
              {expiresLabel && expiresLabel !== 'Expired' && (
                <Text style={styles.expiresText}>
                  Expires in{' '}
                  <Text style={styles.expiresValue}>{expiresLabel}</Text>
                </Text>
              )}
            </View>
          </View>

          <View style={styles.divider} />

          {/* Delivery + Parts Subtotal */}
          <View style={styles.financialRow}>
            <View>
              <Text style={styles.financialLabel}>Delivery by:</Text>
              <Text style={styles.financialValue}>
                {quote.expiresAt ? formatDate(quote.expiresAt) : '-'}
              </Text>
            </View>
            <View>
              <Text style={styles.financialLabel}>Parts Subtotal</Text>
              <Text style={styles.financialValue}>
                {formatPrice(partsSubtotal)}
              </Text>
            </View>
          </View>

          {/* Additional Charges + Grand Total */}
          <View style={styles.financialRow}>
            <View style={styles.flex1}>
              <Text style={styles.financialLabel}>
                Additional Charges (Shipping and Labor)
              </Text>
              <Text style={styles.financialValue}>
                {formatPrice(additionalCharges)}
              </Text>
            </View>
            <View style={styles.grandTotalCol}>
              <Text style={styles.financialLabel}>Grand Total</Text>
              <Text style={styles.financialValue}>
                {formatPrice(quote.totalAmount)}
              </Text>
            </View>
          </View>
        </View>

        {/* ════════════════════════════════════════
            SELECT PAYMENT METHOD
            ════════════════════════════════════════ */}
        <View style={styles.methodCard}>
          <Text style={styles.methodTitle}>Select Payment Method</Text>

          <View style={styles.methodList}>
            {/* ── Credit / Debit Card ── */}
            <TouchableOpacity
              onPress={() => handlePay('card')}
              disabled={paymentLoading}
              activeOpacity={0.8}
              style={[
                styles.methodItem,
                selectedMethod === 'card' && styles.methodItemSelected,
                paymentLoading && styles.methodItemDisabled,
              ]}>
              <View style={styles.methodIconBox}>
                <Image
                  source={creditCardImg}
                  style={styles.creditCardImg}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.methodLabel}>CREDIT/DEBIT CARD</Text>
            </TouchableOpacity>

            {/* ── Net Banking ── */}
            <TouchableOpacity
              onPress={() => handlePay('netbanking')}
              disabled={paymentLoading}
              activeOpacity={0.8}
              style={[
                styles.methodItem,
                selectedMethod === 'netbanking' && styles.methodItemSelected,
                paymentLoading && styles.methodItemDisabled,
              ]}>
              <View style={styles.methodIconBox}>
                <BankIcon width={36} height={34} />
              </View>
              <Text style={styles.methodLabel}>NET BANKING</Text>
            </TouchableOpacity>

            {/* ── UPI ── */}
            <TouchableOpacity
              onPress={() => handlePay('upi')}
              disabled={paymentLoading}
              activeOpacity={0.8}
              style={[
                styles.methodItem,
                styles.methodItemUpi,
                selectedMethod === 'upi' && styles.methodItemSelected,
                paymentLoading && styles.methodItemDisabled,
              ]}>
              {/* UPI logo */}
              <View style={styles.upiLogoBox}>
                <UpiIcon width={66} height={34} />
              </View>

              {/* Stacked payment app icons */}
              <View style={styles.upiAppsRow}>
                <View style={[styles.upiAppCircle, {zIndex: 3}]}>
                  <PhonePeIcon width={28} height={28} />
                </View>
                <View style={[styles.upiAppCircle, styles.upiAppOverlap, {zIndex: 2}]}>
                  <GPayIcon width={28} height={28} />
                </View>
                <View
                  style={[
                    styles.upiAppCircle,
                    styles.upiAppOverlap,
                    styles.upiAppSmall,
                    {zIndex: 1},
                  ]}>
                  <PaytmIcon width={24} height={24} />
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Processing indicator */}
        {paymentLoading && (
          <View style={styles.processingCard}>
            <ActivityIndicator size="small" color="#e5383b" />
            <Text style={styles.processingText}>
              Opening payment gateway...
            </Text>
          </View>
        )}
      </ScrollView>

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
  loadingText: {marginTop: 12, fontSize: 14, color: '#666'},
  notFoundText: {fontSize: 14, color: '#666'},

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
  headerTitle: {fontSize: 24, fontWeight: '600', color: '#e5383b'},
  headerRight: {width: 31},

  scroll: {flex: 1},
  scrollContent: {padding: 16, gap: 16},

  // Summary card
  summaryCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d3d3d3',
    borderRadius: 10,
    padding: 16,
    gap: 16,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  summaryLeft: {flex: 1, gap: 2},
  vehicleName: {fontSize: 14, fontWeight: '600', color: '#4c4c4c'},
  plateNumber: {fontSize: 17, fontWeight: '700', color: '#e5383b'},
  quoteNumber: {fontSize: 14, fontWeight: '700', color: '#e8353b', marginTop: 6},
  dateText: {fontSize: 12, fontWeight: '500', color: '#828282'},
  summaryRight: {alignItems: 'flex-end', gap: 5, flexShrink: 0},
  expiresText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#000',
    textAlign: 'center',
    letterSpacing: -0.41,
  },
  expiresValue: {fontWeight: '700', color: '#e5383b'},
  divider: {height: 1, backgroundColor: '#dadada'},
  financialRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  financialLabel: {fontSize: 11, fontWeight: '500', color: '#000'},
  financialValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#e5383b',
    marginTop: 4,
  },
  flex1: {flex: 1},
  grandTotalCol: {minWidth: 75},

  // Payment method card
  methodCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    gap: 16,
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    letterSpacing: -0.01,
  },
  methodList: {gap: 8},
  methodItem: {
    backgroundColor: '#f3f3f3',
    borderRadius: 16,
    paddingVertical: 17,
    paddingHorizontal: 20,
    height: 92,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  methodItemSelected: {
    backgroundColor: '#ffe8e8',
    borderColor: '#e5383b',
  },
  methodItemDisabled: {opacity: 0.6},
  methodItemUpi: {justifyContent: 'space-between'},
  methodIconBox: {
    width: 43,
    height: 43,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  creditCardImg: {width: 36, height: 34},
  methodLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#737373',
    letterSpacing: -0.01,
  },

  // UPI row
  upiLogoBox: {alignItems: 'center', justifyContent: 'center'},
  upiAppsRow: {flexDirection: 'row', alignItems: 'center'},
  upiAppCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#f3f3f3',
  },
  upiAppOverlap: {marginLeft: -7},
  upiAppSmall: {width: 36, height: 36, borderRadius: 18},

  // Processing indicator
  processingCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  processingText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
});
