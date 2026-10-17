import React, { useRef, useState } from 'react';
import { useCart, type CartItem } from '../../context/CartContext';
import {
  getActiveVehicleVisit,
  type VehicleBasicInfo,
  type VehicleResponse,
} from '../../services/api';
import AddVehicleOverlay from '../overlays/AddVehicleOverlay';
import AppAlert from '../overlays/AppAlert';
import VehicleSelectionOverlay from '../overlays/VehicleSelectionOverlay';
import VehicleTypeSelectionOverlay from '../overlays/VehicleTypeSelectionOverlay';
import { useSendInquiry } from './useSendInquiry';

const fromResponse = (v: VehicleResponse): VehicleBasicInfo => ({
  id: v.id,
  plateNumber: v.plateNumber,
  brand: v.brand,
  model: v.model,
  year: v.year,
  variant: v.variant,
  specs: v.specs,
  ownerName: v.ownerName,
  contactNumber: v.contactNumber,
  imageUrl: v.imageUrl,
});

// The same steps as "Request Part" on the Orders screen: existing vehicle or new vehicle, then pick or add it.
// Mounted only while open, so every open starts at the first step.
function VehicleFlow({
  onClose,
  onSelected,
}: {
  onClose: () => void;
  onSelected: (vehicle: VehicleBasicInfo) => void;
}) {
  const [step, setStep] = useState<'type' | 'existing' | 'new'>('type');

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
      <VehicleSelectionOverlay
        isOpen={step === 'existing'}
        onClose={onClose}
        onVehicleSelected={v => onSelected(fromResponse(v))}
      />
      <AddVehicleOverlay
        isOpen={step === 'new'}
        onClose={onClose}
        onVehicleCreated={handleCreated}
      />
    </>
  );
}

// Sends an availability inquiry. With no vehicle selected it first asks for one (existing or new), then
// carries on with the inquiry. Render `element` once in the screen and call `send` from the button.
export function useInquiryWithVehicle() {
  const { vehicle, setVehicle } = useCart();
  const sendInquiry = useSendInquiry();
  const [flowOpen, setFlowOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  // What the customer was sending when we had to ask for a vehicle
  const pendingItems = useRef<CartItem[] | undefined>(undefined);

  // Stops a second tap from sending the same inquiry twice while the first is in flight
  const sending = useRef(false);

  const run = async (items?: CartItem[], chosen?: VehicleBasicInfo) => {
    if (sending.current) return;
    sending.current = true;
    try {
      const error = await sendInquiry(items, chosen);
      if (error) setMessage(error);
    } finally {
      sending.current = false;
    }
  };

  const send = (items?: CartItem[]) => {
    if (!vehicle) {
      pendingItems.current = items;
      setFlowOpen(true);
      return;
    }
    run(items);
  };

  const handleSelected = (selected: VehicleBasicInfo) => {
    setVehicle(selected);
    setFlowOpen(false);
    // The cart's vehicle updates on the next render, so pass the chosen one along
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
