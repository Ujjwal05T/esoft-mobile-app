import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Animated,
  Easing,
  StyleSheet,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import {discountLabel} from '../overlays/CouponOverlay';
import type {Coupon, CouponValidationResponse} from '../../services/api';

// Coupon pieces shared by the quote payment screen and the catalog Place Order screen:
// the "available coupons" strip, one coupon chip, and the green "coupon applied" banner.

// Green "coupon applied" banner in the summary card — fades/slides in and
// flashes a brighter green so a newly-applied coupon doesn't just pop into
// existence unannounced.
export function AppliedCouponBanner({
  coupon,
  onRemove,
  formatAmount,
}: {
  coupon: CouponValidationResponse;
  onRemove: () => void;
  formatAmount: (amount: number) => string;
}) {
  const {t} = useTranslation();
  const enter = useRef(new Animated.Value(0)).current;
  const flash = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    enter.setValue(0);
    flash.setValue(1);
    Animated.parallel([
      Animated.timing(enter, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(flash, {
        toValue: 0,
        duration: 900,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [coupon.code, enter, flash]);

  const backgroundColor = flash.interpolate({
    inputRange: [0, 1],
    outputRange: ['#f0fdf4', '#bbf7d0'],
  });

  return (
    <Animated.View
      style={[
        styles.couponAppliedRow,
        {
          backgroundColor,
          opacity: enter,
          transform: [
            {
              translateY: enter.interpolate({
                inputRange: [0, 1],
                outputRange: [-8, 0],
              }),
            },
            {
              scale: enter.interpolate({
                inputRange: [0, 1],
                outputRange: [0.96, 1],
              }),
            },
          ],
        },
      ]}
    >
      <View style={styles.couponAppliedLeft}>
        <Text style={styles.couponAppliedCode}>{coupon.code}</Text>
        <Text style={styles.couponAppliedSaving}>
          {t('payment.coupon_saving', {
            amount: formatAmount(coupon.discountAmount),
          })}
        </Text>
      </View>
      <TouchableOpacity
        onPress={onRemove}
        hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
      >
        <Text style={styles.couponRemove}>{t('payment.coupon_remove')}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// Horizontal-strip coupon chip — pops with a small bounce the moment it
// becomes the applied coupon, so the manual-apply/auto-apply result is
// visible right where the user's eyes already are.
export function CouponChip({
  coupon,
  isApplied,
  isApplying,
  disabled,
  onApply,
}: {
  coupon: Coupon;
  isApplied: boolean;
  isApplying: boolean;
  disabled: boolean;
  onApply: () => void;
}) {
  const {t} = useTranslation();
  const scale = useRef(new Animated.Value(1)).current;
  const wasApplied = useRef(isApplied);

  useEffect(() => {
    if (isApplied && !wasApplied.current) {
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.08,
          duration: 140,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          speed: 20,
          bounciness: 8,
        }),
      ]).start();
    }
    wasApplied.current = isApplied;
  }, [isApplied, scale]);

  return (
    <Animated.View
      style={[
        styles.couponChip,
        isApplied && styles.couponChipApplied,
        {transform: [{scale}]},
      ]}
    >
      <View style={styles.couponChipBody}>
        <Text
          style={[
            styles.couponChipDiscount,
            isApplied && styles.couponChipDiscountApplied,
          ]}
          numberOfLines={1}
        >
          {discountLabel(coupon)}
        </Text>
        <Text style={styles.couponChipCode} numberOfLines={1}>
          {coupon.code}
        </Text>
      </View>
      <TouchableOpacity
        onPress={onApply}
        disabled={disabled}
        activeOpacity={0.8}
        style={[styles.couponChipBtn, isApplied && styles.couponChipBtnApplied]}
      >
        {isApplying ? (
          <ActivityIndicator size="small" color="#e5383b" />
        ) : (
          <Text
            style={[
              styles.couponChipBtnText,
              isApplied && styles.couponChipBtnTextApplied,
            ]}
          >
            {isApplied
              ? t('payment.coupon_applied_short')
              : t('payment.coupon_apply')}
          </Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

// "Available coupons": a horizontal strip of chips instead of a code box. Tapping a chip applies that coupon.
export function CouponStrip({
  coupons,
  appliedCode,
  applyingCode,
  onApply,
}: {
  coupons: Coupon[];
  appliedCode?: string | null;
  applyingCode: string | null;
  onApply: (coupon: Coupon) => void;
}) {
  const {t} = useTranslation();
  if (coupons.length === 0) return null;
  return (
    <View style={styles.couponStripWrap}>
      <Text style={styles.couponStripLabel}>
        {t('payment.coupon_available_label')}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.couponStripContent}
      >
        {coupons.map(coupon => (
          <CouponChip
            key={coupon.id}
            coupon={coupon}
            isApplied={appliedCode === coupon.code}
            isApplying={applyingCode === coupon.code}
            disabled={appliedCode === coupon.code || applyingCode !== null}
            onApply={() => onApply(coupon)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  couponStripWrap: {gap: 10, marginTop: -8},
  couponStripLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#99a2b6',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  couponStripContent: {gap: 10, paddingRight: 4, paddingBottom: 2},
  couponChip: {
    width: 188,
    flexDirection: 'row',
    alignItems: 'stretch',
    borderWidth: 1,
    borderColor: '#e8e8e8',
    borderRadius: 12,
    backgroundColor: '#fff',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  couponChipApplied: {borderColor: '#bbf7d0', backgroundColor: '#f0fdf4'},
  couponChipBody: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 8,
    paddingLeft: 12,
    paddingRight: 10,
    gap: 1,
  },
  couponChipDiscount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#e5383b',
    letterSpacing: 0.2,
  },
  couponChipDiscountApplied: {color: '#16a34a'},
  couponChipCode: {
    fontSize: 10,
    fontWeight: '600',
    color: '#99a2b6',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  couponChipBtn: {
    alignSelf: 'center',
    marginRight: 8,
    minWidth: 56,
    height: 28,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5383b',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  couponChipBtnApplied: {borderColor: '#16a34a', backgroundColor: '#dcfce7'},
  couponChipBtnText: {fontSize: 11, fontWeight: '700', color: '#e5383b'},
  couponChipBtnTextApplied: {color: '#16a34a'},
  couponAppliedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  couponAppliedLeft: {gap: 2},
  couponAppliedCode: {fontSize: 13, fontWeight: '700', color: '#16a34a'},
  couponAppliedSaving: {fontSize: 12, fontWeight: '500', color: '#15803d'},
  couponRemove: {fontSize: 12, fontWeight: '600', color: '#e5383b'},
});
