import React, {useEffect} from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, StatusBar } from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import Svg, {Path, Circle} from 'react-native-svg';
import {RootStackParamList} from '../navigation/RootNavigator';

type CallbackRouteProp = RouteProp<RootStackParamList, 'PaymentCallback'>;
type CallbackNavProp = NativeStackNavigationProp<RootStackParamList, 'PaymentCallback'>;

const SuccessIcon = () => (
  <Svg width={72} height={72} viewBox="0 0 72 72" fill="none">
    <Circle cx={36} cy={36} r={36} fill="#dcfce7" />
    <Circle cx={36} cy={36} r={28} fill="#22c55e" />
    <Path
      d="M24 36L32 44L48 28"
      stroke="white"
      strokeWidth={3.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const FailureIcon = () => (
  <Svg width={72} height={72} viewBox="0 0 72 72" fill="none">
    <Circle cx={36} cy={36} r={36} fill="#fee2e2" />
    <Circle cx={36} cy={36} r={28} fill="#e5383b" />
    <Path
      d="M27 27L45 45M45 27L27 45"
      stroke="white"
      strokeWidth={3.5}
      strokeLinecap="round"
    />
  </Svg>
);

export default function PaymentCallbackScreen() {
  const navigation = useNavigation<CallbackNavProp>();
  const route = useRoute<CallbackRouteProp>();

  const {status, order_id, payment_id, reason} = route.params ?? {};
  const isSuccess = status === 'success';

  useEffect(() => {
    // If status is missing the deep link landed here without params — go home
    if (!status) {
      navigation.reset({index: 0, routes: [{name: 'MainTabs'}]});
    }
  }, [status, navigation]);

  if (!status) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#e5383b" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={styles.content}>
        <View style={styles.iconBox}>
          {isSuccess ? <SuccessIcon /> : <FailureIcon />}
        </View>

        <Text style={styles.title}>
          {isSuccess ? 'Payment Successful!' : 'Payment Failed'}
        </Text>

        <Text style={styles.subtitle}>
          {isSuccess
            ? 'Your order has been placed. We will notify you once it is confirmed.'
            : reason
            ? reason
            : 'Something went wrong with your payment. Please try again or contact support.'}
        </Text>

        {(order_id || payment_id) && (
          <View style={styles.refBox}>
            {order_id && (
              <Text style={styles.refText}>
                <Text style={styles.refLabel}>Order ID: </Text>
                {order_id}
              </Text>
            )}
            {payment_id && (
              <Text style={styles.refText}>
                <Text style={styles.refLabel}>Payment ID: </Text>
                {payment_id}
              </Text>
            )}
          </View>
        )}

        <View style={styles.actions}>
          {isSuccess ? (
            <>
              {order_id && !isNaN(Number(order_id)) ? (
                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={() =>
                    navigation.reset({
                      index: 1,
                      routes: [
                        {name: 'MainTabs'},
                        {name: 'OrderDetail', params: {orderId: Number(order_id)}},
                      ],
                    })
                  }>
                  <Text style={styles.primaryBtnText}>View Order</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                style={order_id ? styles.secondaryBtn : styles.primaryBtn}
                onPress={() => navigation.reset({index: 0, routes: [{name: 'MainTabs'}]})}>
                <Text style={order_id ? styles.secondaryBtnText : styles.primaryBtnText}>
                  Go to Home
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => navigation.goBack()}>
                <Text style={styles.primaryBtnText}>Try Again</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => navigation.reset({index: 0, routes: [{name: 'MainTabs'}]})}>
                <Text style={styles.secondaryBtnText}>Go to Home</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  iconBox: {
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  refBox: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 14,
    width: '100%',
    gap: 4,
    marginTop: 4,
  },
  refText: {
    fontSize: 13,
    color: '#374151',
  },
  refLabel: {
    fontWeight: '600',
  },
  actions: {
    width: '100%',
    gap: 10,
    marginTop: 8,
  },
  primaryBtn: {
    height: 50,
    backgroundColor: '#e5383b',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryBtn: {
    height: 50,
    borderWidth: 1.5,
    borderColor: '#e5383b',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e5383b',
  },
});
