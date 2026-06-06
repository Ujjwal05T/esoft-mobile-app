import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import Svg, {Path} from 'react-native-svg';
import {useTranslation} from 'react-i18next';
import {
  getAvailableCoupons,
  validateCoupon,
  type Coupon,
  type CouponValidationResponse,
} from '../../services/api';

const SCREEN_H = Dimensions.get('screen').height;

// ── Props ─────────────────────────────────────────────────────────────────────

interface CouponOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  orderAmount: number;
  workshopOwnerId: number;
  onCouponApplied: (coupon: CouponValidationResponse) => void;
}

// ── Icons ─────────────────────────────────────────────────────────────────────

const CloseIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 6L6 18M6 6l12 12"
      stroke="#161a1d"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ArrowRightIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M5 12H19M19 12L12 5M19 12L12 19"
      stroke="#fff"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// ── Helpers ───────────────────────────────────────────────────────────────────

function isAvailable(coupon: Coupon): boolean {
  if (!coupon.isActive) return false;
  const now = new Date();
  if (new Date(coupon.validFrom) > now) return false;
  if (coupon.validUntil && new Date(coupon.validUntil) < now) return false;
  if (coupon.usageLimit != null && coupon.usageCount >= coupon.usageLimit) return false;
  return true;
}

function discountLabel(coupon: Coupon): string {
  return coupon.discountType === 'percentage'
    ? `${coupon.discountValue}% OFF`
    : `₹${coupon.discountValue} OFF`;
}

function expiryLabel(coupon: Coupon): string | null {
  if (!coupon.validUntil) return null;
  const days = Math.ceil(
    (new Date(coupon.validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
  if (days <= 1) return 'Expires today';
  if (days <= 7) return `Expires in ${days}d`;
  return null;
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function CouponOverlay({
  isOpen,
  onClose,
  orderAmount,
  workshopOwnerId,
  onCouponApplied,
}: CouponOverlayProps) {
  const {t} = useTranslation();

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [applyingCode, setApplyingCode] = useState<string | null>(null);
  const [errorMap, setErrorMap] = useState<Record<string, string>>({});
  const [manualError, setManualError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setManualCode('');
      setManualError(null);
      setErrorMap({});
      setApplyingCode(null);
      return;
    }
    (async () => {
      setFetchLoading(true);
      try {
        const result = await getAvailableCoupons();
        if (result.success && result.data) {
          setCoupons(result.data.filter(isAvailable));
        }
      } finally {
        setFetchLoading(false);
      }
    })();
  }, [isOpen]);

  const applyCode = useCallback(
    async (code: string, isManual = false) => {
      const trimmed = code.trim().toUpperCase();
      if (!trimmed) return;
      setApplyingCode(trimmed);
      if (isManual) setManualError(null);
      else setErrorMap(prev => ({...prev, [trimmed]: ''}));

      try {
        const result = await validateCoupon(trimmed, workshopOwnerId, orderAmount);
        if (result.success && result.data) {
          if (result.data.isValid) {
            onCouponApplied(result.data);
            onClose();
          } else {
            const msg = result.data.errorMessage ?? t('payment.coupon_invalid');
            if (isManual) setManualError(msg);
            else setErrorMap(prev => ({...prev, [trimmed]: msg}));
          }
        } else {
          const msg = t('payment.coupon_invalid');
          if (isManual) setManualError(msg);
          else setErrorMap(prev => ({...prev, [trimmed]: msg}));
        }
      } finally {
        setApplyingCode(null);
      }
    },
    [workshopOwnerId, orderAmount, onCouponApplied, onClose, t],
  );

  const handleClose = () => {
    setManualCode('');
    setManualError(null);
    setErrorMap({});
    setApplyingCode(null);
    onClose();
  };

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent
      onRequestClose={handleClose}>
      <View style={s.overlay}>
        <View style={s.sheet}>
          {/* Drag Handle */}
          <View style={s.dragHandle} />

          {/* Close Button */}
          <TouchableOpacity onPress={handleClose} activeOpacity={0.7} style={s.closeBtn}>
            <CloseIcon />
          </TouchableOpacity>

          {/* Title */}
          <Text style={s.headerTitle}>{t('payment.coupon_overlay_title')}</Text>

          {/* ── Pinned input area ── */}
          <View style={s.inputArea}>
            <View style={[s.codeInput, !!manualCode && s.codeInputFilled]}>
              <TextInput
                style={[s.codeTextInput, !!manualCode && s.codeTextInputFilled]}
                placeholder={t('payment.promo_code_placeholder')}
                placeholderTextColor="#c4c4c4"
                value={manualCode}
                onChangeText={text => {setManualCode(text); setManualError(null);}}
                autoCapitalize="characters"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={() => applyCode(manualCode, true)}
                editable={applyingCode === null}
              />
              <TouchableOpacity
                style={[s.arrowBtn, manualCode.trim() ? s.arrowBtnActive : s.arrowBtnInactive]}
                onPress={() => applyCode(manualCode, true)}
                disabled={!manualCode.trim() || applyingCode !== null}
                activeOpacity={0.85}>
                {applyingCode === manualCode.trim().toUpperCase() && manualCode.trim()
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <ArrowRightIcon />}
              </TouchableOpacity>
            </View>
            {manualError ? (
              <Text style={s.errorHint}>{manualError}</Text>
            ) : (
              <Text style={s.hint}>{t('payment.promo_code_hint')}</Text>
            )}
          </View>

          {/* ── Scrollable coupons list ── */}
          <ScrollView
            style={s.scroll}
            contentContainerStyle={s.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">

            {fetchLoading ? (
              <View style={s.emptyState}>
                <ActivityIndicator size="small" color="#e5383b" />
                <Text style={s.emptySubtitle}>{t('payment.coupon_loading')}</Text>
              </View>
            ) : coupons.length === 0 ? null : (
              <>
                <Text style={s.sectionLabel}>{t('payment.coupon_available_label')}</Text>
                {coupons.map(coupon => {
                  const isApplying = applyingCode === coupon.code;
                  const err = errorMap[coupon.code];
                  const expiry = expiryLabel(coupon);
                  const hasMeta = coupon.minOrderValue != null ||
                    (coupon.maxDiscountAmount != null && coupon.discountType === 'percentage') ||
                    !!expiry ||
                    coupon.firstOrderOnly;

                  return (
                    <View key={coupon.id} style={s.couponCard}>
                      {/* Top row */}
                      <View style={s.couponTopRow}>
                        <Text style={s.couponCode}>{coupon.code}</Text>
                        <View style={s.discountBadge}>
                          <Text style={s.discountBadgeText}>{discountLabel(coupon)}</Text>
                        </View>
                      </View>

                      {/* Description */}
                      <Text style={s.couponDesc} numberOfLines={2}>
                        {coupon.description}
                      </Text>

                      {/* Meta chips */}
                      {hasMeta && (
                        <View style={s.metaRow}>
                          {coupon.minOrderValue != null && (
                            <View style={s.metaChip}>
                              <Text style={s.metaChipText}>Min ₹{coupon.minOrderValue}</Text>
                            </View>
                          )}
                          {coupon.maxDiscountAmount != null && coupon.discountType === 'percentage' && (
                            <View style={s.metaChip}>
                              <Text style={s.metaChipText}>Upto ₹{coupon.maxDiscountAmount}</Text>
                            </View>
                          )}
                          {coupon.firstOrderOnly && (
                            <View style={s.metaChip}>
                              <Text style={s.metaChipText}>First order</Text>
                            </View>
                          )}
                          {expiry && (
                            <View style={[s.metaChip, s.metaChipExpiry]}>
                              <Text style={[s.metaChipText, s.metaChipExpiryText]}>{expiry}</Text>
                            </View>
                          )}
                        </View>
                      )}

                      {/* Error */}
                      {!!err && <Text style={s.couponError}>{err}</Text>}

                      {/* Divider + Apply row */}
                      <View style={s.cardFooter}>
                        <View style={s.cardDivider} />
                        <TouchableOpacity
                          style={s.applyRow}
                          onPress={() => applyCode(coupon.code)}
                          disabled={applyingCode !== null}
                          activeOpacity={0.7}>
                          {isApplying
                            ? <ActivityIndicator size="small" color="#e5383b" />
                            : <Text style={s.applyText}>{t('payment.coupon_apply')}</Text>}
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: SCREEN_H * 0.65,
    paddingBottom: 40,
    paddingTop: 16,
    paddingHorizontal: 18,
    shadowColor: '#e5383b',
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.2,
    shadowRadius: 19.2,
    elevation: 10,
    flex: 1,
  },
  dragHandle: {
    width: 172,
    height: 4,
    backgroundColor: '#d9d9d9',
    borderRadius: 23,
    alignSelf: 'center',
    marginBottom: 34,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 18,
    padding: 4,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: 'rgba(0,0,0,0.25)',
    marginBottom: 24,
    paddingLeft: 8,
    lineHeight: 34,
    letterSpacing: -1,
    paddingTop: 8,
  },

  // Input pinned area
  inputArea: {gap: 6, marginBottom: 16},

  // Scroll
  scroll: {flex: 1},
  scrollContent: {gap: 12, paddingBottom: 12},

  // Code input row
  codeInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d3d3d3',
    borderRadius: 10,
    paddingHorizontal: 10,
    backgroundColor: '#f5f3f4',
  },
  codeInputFilled: {borderColor: '#e5383b'},
  codeTextInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    paddingVertical: 12,
    letterSpacing: 1,
  },
  codeTextInputFilled: {color: '#e5383b'},
  arrowBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  arrowBtnActive: {backgroundColor: '#e5383b'},
  arrowBtnInactive: {backgroundColor: '#828282'},

  hint: {fontSize: 12, color: '#b0b8c8', paddingHorizontal: 4},
  errorHint: {fontSize: 12, color: '#e5383b', paddingHorizontal: 4, fontWeight: '500'},

  // Section label
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#99a2b6',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: 4,
    marginTop: 4,
  },

  // Coupon card
  couponCard: {
    borderWidth: 1,
    borderColor: '#e8e8e8',
    borderRadius: 12,
    backgroundColor: '#fff',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  couponTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  couponCode: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1a1a1a',
    letterSpacing: 0.5,
  },
  discountBadge: {
    backgroundColor: '#fff0f0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ffd5d5',
  },
  discountBadgeText: {fontSize: 12, fontWeight: '700', color: '#e5383b'},
  couponDesc: {
    fontSize: 13,
    color: '#7a8499',
    lineHeight: 18,
    marginBottom: 8,
  },

  // Meta chips row
  metaRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8},
  metaChip: {
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  metaChipText: {fontSize: 11, fontWeight: '500', color: '#7a8499'},
  metaChipExpiry: {backgroundColor: '#fffbeb'},
  metaChipExpiryText: {color: '#d97706'},

  // Per-card error
  couponError: {fontSize: 12, color: '#e5383b', marginBottom: 8, fontWeight: '500'},

  // Card footer (divider + apply button)
  cardFooter: {},
  cardDivider: {height: 1, backgroundColor: '#f0f0f0'},
  applyRow: {
    paddingVertical: 11,
    alignItems: 'center',
  },
  applyText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#e5383b',
    letterSpacing: 0.2,
  },

  // Empty / loading state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptySubtitle: {fontSize: 13, color: '#99a2b6', textAlign: 'center'},
});
