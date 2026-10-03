import React, { useState } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { useCart } from '../../context/CartContext';
import {
  getActiveVehicleVisit,
  type VehicleBasicInfo,
} from '../../services/api';
import AddVehicleOverlay from '../overlays/AddVehicleOverlay';
import SelectCarOverlay, { getVehicleFullName } from './SelectCarOverlay';
import VehicleSelector from './VehicleSelector';

// Vehicle dropdown + "Select Car" / "Add Car" sheets, backed by the shared cart vehicle.
export default function VehiclePicker({
  style,
}: {
  style?: StyleProp<ViewStyle>;
}) {
  const { vehicle, setVehicle } = useCart();
  const [selectOpen, setSelectOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const handleSelected = (v: VehicleBasicInfo) => {
    setVehicle(v);
    setSelectOpen(false);
  };

  const handleCreated = async (vehicleId: number) => {
    setAddOpen(false);
    const res = await getActiveVehicleVisit(vehicleId);
    if (res.success && res.data?.vehicle) {
      setVehicle(res.data.vehicle);
    }
  };

  return (
    <>
      <VehicleSelector
        style={style}
        selected={vehicle ? getVehicleFullName(vehicle) : null}
        onPress={() => setSelectOpen(true)}
      />
      <SelectCarOverlay
        isOpen={selectOpen}
        onClose={() => setSelectOpen(false)}
        onSelect={handleSelected}
        onAddCar={() => {
          setSelectOpen(false);
          setAddOpen(true);
        }}
      />
      <AddVehicleOverlay
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        onVehicleCreated={handleCreated}
      />
    </>
  );
}
