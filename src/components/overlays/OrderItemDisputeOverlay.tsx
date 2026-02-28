import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import type {OrderItemApiResponse} from '../../services/api';

interface OrderItemDisputeOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  item: OrderItemApiResponse;
  isDelivered: boolean;
  deliveryDateStr: string;
  onRaiseDispute: (item: OrderItemApiResponse) => void;
}

// Floating-label read-only field
const InfoField = ({
  label,
  value,
  active,
}: {
  label: string;
  value: string;
  active: boolean;
}) => {
  const borderColor = active ? '#e5383b' : '#dadada';
  const labelColor = active ? '#e5383b' : '#9e9e9e';

  return (
    <View style={styles.fieldContainer}>
      <View style={[styles.fieldInput, {borderColor}]}>
        <Text style={styles.fieldValue} numberOfLines={1}>
          {value || '–'}
        </Text>
      </View>
      {/* Floating label */}
      <View style={styles.floatingLabel}>
        <Text style={[styles.labelText, {color: labelColor}]}>{label}</Text>
      </View>
    </View>
  );
};

export default function OrderItemDisputeOverlay({
  isOpen,
  onClose,
  item,
  isDelivered,
  deliveryDateStr,
  onRaiseDispute,
}: OrderItemDisputeOverlayProps) {
  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose}>
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      {/* Bottom sheet */}
      <View style={styles.sheet}>
        {/* Drag handle */}
        <View style={styles.handle} />

        {/* Part name */}
        <Text style={styles.partName}>{item.partName}</Text>

        {/* 2-column grid of fields */}
        <View style={styles.fieldsGrid}>
          {/* Row 1: Price & Quantity */}
          <View style={styles.row}>
            <InfoField
              label="Price"
              value={`Rs ${item.unitPrice.toLocaleString('en-IN')}`}
              active={isDelivered}
            />
            <InfoField
              label="Quantity"
              value={String(item.quantity)}
              active={isDelivered}
            />
          </View>

          {/* Row 2: Brand & Delivery date */}
          <View style={styles.row}>
            <InfoField
              label="Brand"
              value={item.brand || 'OEM'}
              active={isDelivered}
            />
            <InfoField
              label={isDelivered ? 'Delivered on' : 'Delivery by'}
              value={deliveryDateStr || '–'}
              active={isDelivered}
            />
          </View>
        </View>

        {/* Raise Dispute button */}
        {isDelivered ? (
          <TouchableOpacity
            style={styles.raiseButton}
            onPress={() => onRaiseDispute(item)}
            activeOpacity={0.8}>
            <Text style={styles.raiseButtonText}>RAISE DISPUTE</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.raiseButtonDisabled}>
            <Text style={styles.raiseButtonTextDisabled}>RAISE DISPUTE</Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingBottom: 8,
    paddingTop: 16,
    gap: 25,
    alignItems: 'center',
  },
  handle: {
    width: 172,
    height: 4,
    backgroundColor: '#d9d9d9',
    borderRadius: 23,
  },
  partName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#323232',
    alignSelf: 'flex-start',
  },
  fieldsGrid: {
    width: '100%',
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  fieldContainer: {
    flex: 1,
    position: 'relative',
  },
  fieldInput: {
    height: 53,
    borderWidth: 1,
    borderRadius: 6.5,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  fieldValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  floatingLabel: {
    position: 'absolute',
    left: 12,
    top: -8,
    backgroundColor: '#ffffff',
    paddingHorizontal: 2,
  },
  labelText: {
    fontSize: 10,
    fontFamily: 'Poppins',
  },
  raiseButton: {
    width: '100%',
    height: 56,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5383b',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 9,
  },
  raiseButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#e5383b',
    letterSpacing: -0.01,
  },
  raiseButtonDisabled: {
    width: '100%',
    height: 56,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dadada',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 9,
  },
  raiseButtonTextDisabled: {
    fontSize: 15,
    fontWeight: '600',
    color: '#dadada',
    letterSpacing: -0.01,
  },
});
