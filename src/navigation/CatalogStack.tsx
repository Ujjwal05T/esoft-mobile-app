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

export type CatalogStackParamList = {
  CatalogHome: undefined;
  MyCart: undefined;
  PartDetail: { product: PartProduct; categoryTitle: string };
  PlaceOrder: undefined;
  InquirySent: { inquiryId: string; raisedOn: string; items: CartItem[] };
  Checkout: { orderId: string; estimatedDelivery: string; amountPaid: string };
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
        <Stack.Screen name="InquirySent" component={InquirySentScreen} />
        <Stack.Screen name="Checkout" component={CheckoutScreen} />
      </Stack.Navigator>
    </CartProvider>
  );
}
