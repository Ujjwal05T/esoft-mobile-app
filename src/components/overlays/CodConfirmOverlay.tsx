import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
} from 'react-native';
import Svg, {Path, Circle} from 'react-native-svg';
import {useTranslation} from 'react-i18next';

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
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

const WalletIcon = () => (
  <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
    <Path
      d="M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7Z"
      stroke="#e5383b"
      strokeWidth={1.6}
    />
    <Path
      d="M16 12a1 1 0 1 0 2 0 1 1 0 0 0-2 0Z"
      fill="#e5383b"
    />
    <Path
      d="M2 10h20"
      stroke="#e5383b"
      strokeWidth={1.6}
      strokeLinecap="round"
    />
  </Svg>
);

const InfoIcon = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={10} stroke="#d97706" strokeWidth={1.8} />
    <Path
      d="M12 8v4M12 16h.01"
      stroke="#d97706"
      strokeWidth={2}
      strokeLinecap="round"
    />
  </Svg>
);

// ── Props ─────────────────────────────────────────────────────────────────────

interface CodConfirmOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (idempotencyKey: string) => void;
  payableAmount: number;
  loading: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CodConfirmOverlay({
  isOpen,
  onClose,
  onConfirm,
  payableAmount,
  loading,
}: CodConfirmOverlayProps) {
  const {t} = useTranslation();
  // Generated once per sheet open — reused by any network retries, replaced on next open
  const idempotencyKey = useRef<string>('');

  useEffect(() => {
    if (isOpen) {
      idempotencyKey.current = generateUUID();
    }
  }, [isOpen]);

  const formattedAmount = `Rs. ${payableAmount.toLocaleString('en-IN')}`;

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent
      onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.sheet}>
          {/* Drag Handle */}
          <View style={s.dragHandle} />

          {/* Close Button */}
          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.7}
            style={s.closeBtn}
            disabled={loading}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <CloseIcon />
          </TouchableOpacity>

          {/* Title */}
          <Text style={s.headerTitle}>{t('payment.cod')}</Text>

          {/* Amount card */}
          <View style={s.amountCard}>
            <WalletIcon />
            <View style={s.amountTextCol}>
              <Text style={s.amountLabel}>{t('payment.cod_amount_due')}</Text>
              <Text style={s.amountValue}>{formattedAmount}</Text>
            </View>
          </View>

          {/* Info note */}
          <View style={s.infoRow}>
            <InfoIcon />
            <Text style={s.infoText}>{t('payment.cod_note')}</Text>
          </View>

          <View style={s.divider} />

          {/* Confirm button */}
          <TouchableOpacity
            style={[s.confirmBtn, loading && s.confirmBtnDisabled]}
            onPress={() => onConfirm(idempotencyKey.current)}
            disabled={loading}
            activeOpacity={0.85}>
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={s.confirmBtnText}>{t('payment.cod_confirm_btn')}</Text>
            )}
          </TouchableOpacity>

          {/* Cancel link */}
          <TouchableOpacity
            onPress={onClose}
            disabled={loading}
            activeOpacity={0.7}
            style={s.cancelBtn}>
            <Text style={s.cancelText}>{t('payment.coupon_cancel')}</Text>
          </TouchableOpacity>
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
    paddingBottom: 40,
    paddingTop: 16,
    paddingHorizontal: 18,
    shadowColor: '#e5383b',
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.2,
    shadowRadius: 19.2,
    elevation: 10,
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

  // Amount card
  amountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#fff5f5',
    borderWidth: 1,
    borderColor: '#ffd5d5',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  amountTextCol: {gap: 2},
  amountLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#828282',
  },
  amountValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#e5383b',
    letterSpacing: -0.5,
  },

  // Info note
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: '#92400e',
    lineHeight: 18,
  },

  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginBottom: 16,
  },

  // Confirm button
  confirmBtn: {
    backgroundColor: '#e5383b',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    minHeight: 52,
  },
  confirmBtnDisabled: {opacity: 0.6},
  confirmBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.2,
  },

  // Cancel
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#828282',
  },
});
