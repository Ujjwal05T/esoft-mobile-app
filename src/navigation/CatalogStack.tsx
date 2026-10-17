import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CartProvider } from '../context/CartContext';
import CatalogScreen from '../screens/CatalogScreen';
import MyCartScreen from '../screens/MyCartScreen';
import PlaceOrderScreen from '../screens/PlaceOrderScreen';
import InquirySentScreen from '../screens/InquirySentScreen';
import type { CartItem } from '../context/CartContext';
import type { PartProduct } from '../components/dashboard/PartProductCard';
import PartDetailScreen from '../screens/PartDetailScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import AddressesScreen from '../screens/AddressesScreen';
import AddressFormScreen from '../screens/AddressFormScreen';
import type { WorkshopAddress } from '../services/api';

export type CatalogStackParamList = {
  CatalogHome: undefined;
  MyCart: undefined;
  PartDetail: { product: PartProduct; categoryTitle: string };
  PlaceOrder: { addressId?: number } | undefined;
  Addresses: { select?: boolean; selectedId?: number } | undefined;
  AddressForm: { address?: WorkshopAddress } | undefined;
  InquirySent: { inquiryId: string; raisedOn: string; items: CartItem[] };
  Checkout: { orderId: number };
};

const Stack = createNativeStackNavigator<CatalogStackParamList>();

export default function CatalogStack() {
  return (
    <CartProvider>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="CatalogHome" component={CatalogScreen} />
        <Stack.Screen name="PartDetail" component={PartDetailScreen} />
        <Stack.Screen name="MyCart" component={MyCartScreen} />
        <Stack.Screen name="PlaceOrder" component={PlaceOrderScreen} />
        <Stack.Screen name="Addresses" component={AddressesScreen} />
        <Stack.Screen name="AddressForm" component={AddressFormScreen} />
        <Stack.Screen name="InquirySent" component={InquirySentScreen} />
        <Stack.Screen name="Checkout" component={CheckoutScreen} />
      </Stack.Navigator>
    </CartProvider>
  );
}
