import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CatalogStackParamList } from '../../navigation/CatalogStack';
import {
  createInquiry,
  getStoredUser,
  type InquiryItemRequest,
  type VehicleBasicInfo,
} from '../../services/api';
import { useCart, type CartItem } from '../../context/CartContext';

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

// The job category every catalog inquiry is filed under
const JOB_CATEGORY = 'Default';

// Sends an availability inquiry to ETNA for on-order parts: a real inquiry that sales quotes in the portal.
// Returns an error message to show when it can't proceed; on success the sent parts leave the cart
// and the "inquiry sent" screen opens.
export function useSendInquiry() {
  const navigation =
    useNavigation<NativeStackNavigationProp<CatalogStackParamList>>();
  const { items, vehicle, removeWhere } = useCart();

  // With no items given it sends the cart's on-order parts.
  // `vehicleOverride` is for a vehicle picked a moment ago, before the cart has re-rendered with it.
  return async (
    itemsOverride?: CartItem[],
    vehicleOverride?: VehicleBasicInfo,
  ): Promise<string | null> => {
    const inquiryVehicle = vehicleOverride ?? vehicle;
    if (!inquiryVehicle) {
      return 'Please select a vehicle before sending an inquiry.';
    }
    const toSend =
      itemsOverride ??
      items.filter(i => i.product.outOfStock && !i.unavailable);
    if (toSend.length === 0) {
      return 'There are no on-order parts to send an inquiry for.';
    }

    const user = await getStoredUser();
    if (!user) return 'Please sign in again and retry.';

    const requestItems: InquiryItemRequest[] = toSend.map(i => ({
      partName: i.product.name,
      // The catalog SKU is the part number sales will quote against
      partNumber: i.product.sku,
      preferredBrand: i.product.brand,
      quantity: i.quantity,
      remark: i.product.volume
        ? `Parts catalog item (${i.product.volume})`
        : 'Parts catalog item',
      productVariantId: Number(i.product.id),
    }));

    const res = await createInquiry({
      vehicleId: inquiryVehicle.id,
      workshopOwnerId: user.workshopOwnerId ?? user.id,
      // A staff member's request waits for the owner's approval, as with other inquiries
      requestedByStaffId: user.role === 'staff' ? user.id : null,
      jobCategories: [JOB_CATEGORY],
      items: requestItems,
    });
    if (!res.success || !res.data) {
      return res.error ?? 'Could not send the inquiry. Please try again.';
    }

    const sentIds = new Set(toSend.map(i => i.product.id));
    removeWhere(i => sentIds.has(i.product.id));

    const placed = new Date(res.data.placedDate);
    navigation.replace('InquirySent', {
      inquiryId: res.data.inquiryNumber,
      raisedOn: `${placed.getDate()} ${
        MONTHS[placed.getMonth()]
      } ${placed.getFullYear()}`,
      items: toSend,
    });
    return null;
  };
}
