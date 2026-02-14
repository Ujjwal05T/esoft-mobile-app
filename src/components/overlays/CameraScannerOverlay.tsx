import React, {useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import {Camera, useCameraDevice, useCameraPermission} from 'react-native-vision-camera';
import Svg, {Path} from 'react-native-svg';

const {width: SCREEN_W, height: SCREEN_H} = Dimensions.get('window');

const FRAME_MARGIN_H = 24;
const FRAME_W = SCREEN_W - FRAME_MARGIN_H * 2;

// RC card is taller (ID card ratio ≈ 1.58:1), plate is short and wide
const FRAME_H: Record<ScanMode, number> = {
  plate: Math.round(FRAME_W / 3.5),
  rc: Math.round(FRAME_W / 1.6),
};

const FRAME_TOP = (SCREEN_H - 260) / 2; // roughly centre-ish, above capture btn
const CORNER_LEN = 24;
const CORNER_W = 3;

export type ScanMode = 'plate' | 'rc';

interface Props {
  visible: boolean;
  mode: ScanMode;
  onCapture: (uri: string) => void;
  onClose: () => void;
}

function CornerBrackets({frameH}: {frameH: number}) {
  const corners: {top: number; left: number; rotate: string}[] = [
    {top: FRAME_TOP, left: FRAME_MARGIN_H, rotate: '0deg'},
    {top: FRAME_TOP, left: FRAME_MARGIN_H + FRAME_W - CORNER_LEN, rotate: '90deg'},
    {
      top: FRAME_TOP + frameH - CORNER_LEN,
      left: FRAME_MARGIN_H,
      rotate: '270deg',
    },
    {
      top: FRAME_TOP + frameH - CORNER_LEN,
      left: FRAME_MARGIN_H + FRAME_W - CORNER_LEN,
      rotate: '180deg',
    },
  ];
  return (
    <>
      {corners.map((c, i) => (
        <View
          key={i}
          style={[
            styles.corner,
            {
              top: c.top,
              left: c.left,
              transform: [{rotate: c.rotate}],
            },
          ]}
        />
      ))}
    </>
  );
}

export default function CameraScannerOverlay({
  visible,
  mode,
  onCapture,
  onClose,
}: Props) {
  const cameraRef = useRef<Camera>(null);
  const device = useCameraDevice('back');
  const {hasPermission, requestPermission} = useCameraPermission();

  const frameH = FRAME_H[mode];

  const handleCapture = async () => {
    if (!cameraRef.current) {
      return;
    }
    const photo = await cameraRef.current.takePhoto({flash: 'off'});
    onCapture(`file://${photo.path}`);
  };

  if (!visible) {
    return null;
  }

  if (!hasPermission) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Camera permission required</Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={StyleSheet.absoluteFill}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Camera preview */}
      {device ? (
        <Camera
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={visible}
          photo
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.noCamera]} />
      )}

      {/* Dark overlay — top */}
      <View
        style={[styles.overlay, {top: 0, left: 0, right: 0, height: FRAME_TOP}]}
      />
      {/* Dark overlay — left strip */}
      <View
        style={[
          styles.overlay,
          {
            top: FRAME_TOP,
            left: 0,
            width: FRAME_MARGIN_H,
            height: frameH,
          },
        ]}
      />
      {/* Dark overlay — right strip */}
      <View
        style={[
          styles.overlay,
          {
            top: FRAME_TOP,
            right: 0,
            width: FRAME_MARGIN_H,
            height: frameH,
          },
        ]}
      />
      {/* Dark overlay — bottom */}
      <View
        style={[
          styles.overlay,
          {top: FRAME_TOP + frameH, left: 0, right: 0, bottom: 0},
        ]}
      />

      {/* Corner brackets */}
      <CornerBrackets frameH={frameH} />

      {/* Safe area header */}
      <SafeAreaView style={styles.safeHeader}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.8}>
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
              <Path
                d="M18 6L6 18M6 6L18 18"
                stroke="#ffffff"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </Svg>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {mode === 'plate' ? 'Scan Number Plate' : 'Scan RC Card'}
          </Text>
          {/* Spacer to centre the title */}
          <View style={styles.closeBtn} />
        </View>
      </SafeAreaView>

      {/* Hint below frame */}
      <Text style={[styles.hint, {top: FRAME_TOP + frameH + 20}]}>
        {mode === 'plate'
          ? 'Align the number plate within the frame'
          : 'Align the RC card within the frame'}
      </Text>

      {/* Capture button */}
      <View style={styles.captureArea}>
        <TouchableOpacity
          style={styles.captureBtn}
          onPress={handleCapture}
          activeOpacity={0.85}>
          <View style={styles.captureInner} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.62)',
  },
  noCamera: {
    backgroundColor: '#111',
  },
  corner: {
    position: 'absolute',
    width: CORNER_LEN,
    height: CORNER_LEN,
    borderTopWidth: CORNER_W,
    borderLeftWidth: CORNER_W,
    borderColor: '#ffffff',
  },
  // Safe-area header
  safeHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
  },
  captureArea: {
    position: 'absolute',
    bottom: 48,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  captureInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#e5383b',
  },
  // Permission prompt
  permissionContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  permissionText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  permissionBtn: {
    backgroundColor: '#e5383b',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
