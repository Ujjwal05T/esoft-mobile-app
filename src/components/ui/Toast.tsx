import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Svg, {Circle, Path} from 'react-native-svg';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  type?: ToastType;
  title?: string;
  message: string;
  /** ms before auto-dismiss. Defaults to 3200. */
  duration?: number;
  actionLabel?: string;
  onActionPress?: () => void;
}

interface ToastItem extends ToastOptions {
  id: number;
}

// Mounted once at the app root (see App.tsx). Any screen can call
// `showToast(...)` without prop-drilling or a context provider.
type Listener = (options: ToastOptions) => void;
let listener: Listener | null = null;
let nextId = 1;

export function showToast(options: ToastOptions) {
  if (listener) {
    listener(options);
  } else if (__DEV__) {
    console.warn('[Toast] showToast called before <ToastHost /> mounted');
  }
}

const TYPE_CONFIG: Record<ToastType, {accent: string; iconBg: string}> = {
  success: {accent: '#16a34a', iconBg: '#dcfce7'},
  error: {accent: '#e5383b', iconBg: '#fee2e2'},
  warning: {accent: '#d97706', iconBg: '#fef3c7'},
  info: {accent: '#3b82f6', iconBg: '#dbeafe'},
};

const CheckIcon = ({color}: {color: string}) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 6L9 17l-5-5"
      stroke={color}
      strokeWidth={2.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ErrorIcon = ({color}: {color: string}) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 6L6 18M6 6l12 12"
      stroke={color}
      strokeWidth={2.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const WarningIcon = ({color}: {color: string}) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path
      d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M12 9v4" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    <Circle cx={12} cy={17} r={1} fill={color} />
  </Svg>
);

const InfoIcon = ({color}: {color: string}) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={1.8} />
    <Path d="M12 16v-5" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
    <Circle cx={12} cy={8} r={1} fill={color} />
  </Svg>
);

const CloseIcon = () => (
  <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 6L6 18M6 6l12 12"
      stroke="#9ca3af"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ICONS: Record<ToastType, React.FC<{color: string}>> = {
  success: CheckIcon,
  error: ErrorIcon,
  warning: WarningIcon,
  info: InfoIcon,
};

const HIDDEN_Y = -140;

export default function ToastHost() {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastItem | null>(null);
  const translateY = useRef(new Animated.Value(HIDDEN_Y)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: HIDDEN_Y,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {toValue: 0, duration: 180, useNativeDriver: true}),
    ]).start(() => setToast(null));
  }, [translateY, opacity]);

  useEffect(() => {
    listener = (options: ToastOptions) => {
      if (timerRef.current) clearTimeout(timerRef.current);

      setToast({id: nextId++, ...options});
      translateY.setValue(HIDDEN_Y);
      opacity.setValue(0);
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {toValue: 1, duration: 280, useNativeDriver: true}),
      ]).start();

      timerRef.current = setTimeout(dismiss, options.duration ?? 3200);
    };
    return () => {
      listener = null;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [dismiss, translateY, opacity]);

  if (!toast) return null;

  const type = toast.type ?? 'info';
  const {accent, iconBg} = TYPE_CONFIG[type];
  const Icon = ICONS[type];

  return (
    <View pointerEvents="box-none" style={[styles.wrapper, {top: insets.top + 8}]}>
      <Animated.View style={[styles.toast, {transform: [{translateY}], opacity}]}>
        <TouchableOpacity activeOpacity={0.92} onPress={dismiss} style={styles.card}>
          <View style={[styles.iconCircle, {backgroundColor: iconBg}]}>
            <Icon color={accent} />
          </View>
          <View style={styles.textCol}>
            {!!toast.title && <Text style={styles.title}>{toast.title}</Text>}
            <Text style={styles.message} numberOfLines={2}>
              {toast.message}
            </Text>
          </View>
          {toast.actionLabel ? (
            <TouchableOpacity
              onPress={() => {
                toast.onActionPress?.();
                dismiss();
              }}
              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
              style={styles.actionBtn}>
              <Text style={[styles.actionText, {color: accent}]}>{toast.actionLabel}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={dismiss}
              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
              style={styles.closeBtn}>
              <CloseIcon />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
    elevation: 9999,
  },
  toast: {
    width: '92%',
    maxWidth: 480,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textCol: {flex: 1, gap: 1},
  title: {fontSize: 13, fontWeight: '700', color: '#1a1a1a'},
  message: {fontSize: 13, fontWeight: '500', color: '#4b5563', lineHeight: 18},
  actionBtn: {paddingLeft: 8},
  actionText: {fontSize: 13, fontWeight: '700'},
  closeBtn: {paddingLeft: 4},
});
