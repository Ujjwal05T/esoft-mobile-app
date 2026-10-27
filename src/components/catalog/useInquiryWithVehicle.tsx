import React, { useRef, useState } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, View } from 'react-native';
import type { CartItem } from '../../context/CartContext';
import {
  getActiveVehicleVisit,
  type VehicleBasicInfo,
} from '../../services/api';
import AddVehicleOverlay from '../overlays/AddVehicleOverlay';
import AppAlert from '../overlays/AppAlert';
import VehicleTypeSelectionOverlay from '../overlays/VehicleTypeSelectionOverlay';
import SelectCarOverlay, { getVehicleFullName } from './SelectCarOverlay';
import { useSendInquiry } from './useSendInquiry';

// The same steps as "Request Part" on the Orders screen: existing vehicle or new vehicle, then pick (from the list of all vehicles) or add it.
// Mounted only while open, so every open starts at the first step.
function VehicleFlow({
  onClose,
  onSelected,
}: {
  onClose: () => void;
  onSelected: (vehicle: VehicleBasicInfo) => void;
}) {
  const [step, setStep] = useState<'type' | 'existing' | 'new'>('type');
  // A car tapped in the list, waiting for the customer to confirm sending the inquiry
  const [picked, setPicked] = useState<VehicleBasicInfo | null>(null);

  const handleCreated = async (vehicleId: number) => {
    const res = await getActiveVehicleVisit(vehicleId);
    if (res.success && res.data?.vehicle) onSelected(res.data.vehicle);
    else onClose();
  };

  return (
    <>
      <VehicleTypeSelectionOverlay
        isOpen={step === 'type'}
        onClose={onClose}
        onSelectExisting={() => setStep('existing')}
        onSelectNew={() => setStep('new')}
      />
      <SelectCarOverlay
        isOpen={step === 'existing' && !picked}
        onClose={onClose}
        onSelect={setPicked}
      />
      <AppAlert
        isOpen={!!picked}
        type="confirm"
        message={`Send the inquiry for ${
          picked ? getVehicleFullName(picked) : ''
        } (${picked?.plateNumber ?? ''})?`}
        confirmText="Send"
        onConfirm={() => picked && onSelected(picked)}
        onClose={() => setPicked(null)}
      />
      <AddVehicleOverlay
        isOpen={step === 'new'}
        onClose={onClose}
        onVehicleCreated={handleCreated}
      />
    </>
  );
}

// Sends an availability inquiry. It always asks which vehicle the inquiry is for (existing or new), then
// carries on with it. That vehicle only links the inquiry: it is not the catalog's vehicle filter.
// Render `element` once in the screen and call `send` from the button.
export function useInquiryWithVehicle() {
  const sendInquiry = useSendInquiry();
  const [flowOpen, setFlowOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  // What the customer was sending when we had to ask for a vehicle
  const pendingItems = useRef<CartItem[] | undefined>(undefined);

  // Stops a second tap from sending the same inquiry twice while the first is in flight
  const sending = useRef(false);
  // Shows a "Sending…" box while the inquiry goes to the server
  const [busy, setBusy] = useState(false);

  const run = async (
    items: CartItem[] | undefined,
    chosen: VehicleBasicInfo,
  ) => {
    if (sending.current) return;
    sending.current = true;
    setBusy(true);
    try {
      const error = await sendInquiry(items, chosen);
      if (error) setMessage(error);
    } finally {
      sending.current = false;
      setBusy(false);
    }
  };

  const send = (items?: CartItem[]) => {
    pendingItems.current = items;
    setFlowOpen(true);
  };

  const handleSelected = (selected: VehicleBasicInfo) => {
    setFlowOpen(false);
    run(pendingItems.current, selected);
  };

  const element = (
    <>
      {flowOpen && (
        <VehicleFlow
          onClose={() => setFlowOpen(false)}
          onSelected={handleSelected}
        />
      )}
      <Modal visible={busy} transparent animationType="fade">
        <View style={sendingStyles.backdrop}>
          <View style={sendingStyles.box}>
            <ActivityIndicator size="large" color="#e5383b" />
            <Text style={sendingStyles.text}>Sending inquiry…</Text>
          </View>
        </View>
      </Modal>
      <AppAlert
        isOpen={!!message}
        type="info"
        message={message ?? ''}
        onClose={() => setMessage(null)}
      />
    </>
  );

  return { send, element };
}

const sendingStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 22,
    paddingHorizontal: 30,
    alignItems: 'center',
    gap: 12,
  },
  text: { fontSize: 14, color: '#161a1d', fontWeight: '600' },
});
