import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CatalogStackParamList } from '../../navigation/CatalogStack';
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

// Sends an availability inquiry for the out-of-stock parts in the cart.
// Returns an error message to show when it can't proceed, otherwise navigates away.
export function useSendInquiry() {
  const navigation =
    useNavigation<NativeStackNavigationProp<CatalogStackParamList>>();
  const { items, vehicle, removeWhere } = useCart();

  // With no argument it sends the cart's out-of-stock parts and clears them from the cart.
  return (itemsOverride?: CartItem[]): string | null => {
    if (!vehicle) {
      return 'Please select a vehicle in the catalog before sending an inquiry.';
    }
    const outOfStockItems =
      itemsOverride ?? items.filter(i => i.product.outOfStock);

    // Dummy inquiry — replace with the create-inquiry API when it is connected
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const inquiryId = `INQ-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(
      now.getDate(),
    )}-${Math.floor(100 + Math.random() * 900)}`;
    const raisedOn = `${now.getDate()} ${
      MONTHS[now.getMonth()]
    } ${now.getFullYear()}`;

    if (!itemsOverride) removeWhere(i => !!i.product.outOfStock);
    navigation.replace('InquirySent', {
      inquiryId,
      raisedOn,
      items: outOfStockItems,
    });
    return null;
  };
}
