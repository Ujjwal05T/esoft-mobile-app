import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Svg, {Path} from 'react-native-svg';
import {useTranslation} from 'react-i18next';

interface BulkBadgeProps {
  // True while an admin hasn't itemised the request yet
  pending?: boolean;
  // Short label for tight spots such as list cards
  compact?: boolean;
  // Logo + "Bulk" only, sized like a StatusBadge so it can stand in for one
  minimal?: boolean;
}

// "Layers" glyph: a stack of items, i.e. a bundled request
const StackIcon = ({color}: {color: string}) => (
  <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
      stroke={color}
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default function BulkBadge({pending = false, compact = false, minimal = false}: BulkBadgeProps) {
  const {t} = useTranslation();
  const palette = pending || minimal ? PENDING : DONE;

  if (minimal) {
    return (
      <View style={[styles.pill, styles.minimalPill, {backgroundColor: palette.bg, borderColor: palette.border}]}>
        <StackIcon color={palette.fg} />
        <Text style={[styles.minimalText, {color: palette.fg}]}>{t('bulk_request.badge_short')}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.pill, {backgroundColor: palette.bg, borderColor: palette.border}]}>
      <StackIcon color={palette.fg} />
      <Text style={[styles.text, {color: palette.fg}]}>
        {pending
          ? t(compact ? 'bulk_request.badge_pending_short' : 'bulk_request.badge_pending')
          : t(compact ? 'bulk_request.badge_short' : 'bulk_request.badge')}
      </Text>
    </View>
  );
}

const PENDING = {bg: '#fff7e6', border: '#f5c26b', fg: '#8a5a00'};
const DONE = {bg: '#fdecec', border: '#f7c6c7', fg: '#e5383b'};

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  text: {fontSize: 11, fontWeight: '700'},
  // Same footprint as StatusBadge (radius 7, 12/4 padding) so swapping it in doesn't shift the card
  minimalPill: {paddingHorizontal: 10, paddingVertical: 3, borderRadius: 7},
  minimalText: {fontSize: 12, fontWeight: '600'},
});
