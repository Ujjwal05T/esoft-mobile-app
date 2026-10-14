import React from 'react';
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Image,
  ImageSourcePropType,
  StyleSheet,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

type SvgIcon = React.FC<{ width?: number; height?: number; color?: string }>;

export interface CatalogCategory {
  key: string;
  label: string;
  Icon?: SvgIcon;
  image?: ImageSourcePropType;
  // Remote icon from the catalog API
  imageUrl?: string | null;
}

interface CategorySidebarProps {
  categories: CatalogCategory[];
  selectedKey: string;
  onSelect: (key: string) => void;
  bottomInset?: number;
}

const ICON_SIZE = 44;

function CategoryGraphic({ category }: { category: CatalogCategory }) {
  if (category.imageUrl) {
    return (
      <Image
        source={{ uri: category.imageUrl }}
        style={{ width: ICON_SIZE, height: ICON_SIZE }}
        resizeMode="contain"
      />
    );
  }
  if (category.image) {
    return (
      <Image
        source={category.image}
        style={{ width: ICON_SIZE, height: ICON_SIZE }}
        resizeMode="contain"
      />
    );
  }
  const Icon = category.Icon;
  if (Icon) {
    return <Icon width={ICON_SIZE} height={ICON_SIZE} color="#e5383b" />;
  }
  // No icon uploaded yet: show the category's first letter instead of an empty gap
  return (
    <View style={placeholderStyles.circle}>
      <Text style={placeholderStyles.letter}>
        {category.label.charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}

export default function CategorySidebar({
  categories,
  selectedKey,
  onSelect,
  bottomInset = 0,
}: CategorySidebarProps) {
  return (
    <ScrollView
      style={styles.sidebar}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: 10 + bottomInset },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {categories.map(category => {
        const active = category.key === selectedKey;
        const body = (
          <>
            <CategoryGraphic category={category} />
            <Text
              numberOfLines={2}
              style={[styles.label, active && styles.labelActive]}
            >
              {category.label}
            </Text>
          </>
        );
        return (
          <TouchableOpacity
            key={category.key}
            activeOpacity={0.85}
            onPress={() => onSelect(category.key)}
          >
            {active ? (
              <LinearGradient
                colors={['#ffffff', 'rgba(229,56,59,0.55)', '#e5383b']}
                locations={[0, 0.55, 1]}
                style={[styles.tile, styles.tileActive]}
              >
                {body}
              </LinearGradient>
            ) : (
              <View style={[styles.tile, styles.tileIdle]}>{body}</View>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  sidebar: { width: 108, flexGrow: 0 },
  content: { paddingHorizontal: 8, paddingVertical: 10, gap: 10 },
  tile: {
    height: 96,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 4,
    overflow: 'hidden',
  },
  tileIdle: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#efefef',
  },
  tileActive: {},
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#161a1d',
    textAlign: 'center',
    lineHeight: 14,
  },
  labelActive: { color: '#ffffff' },
});

const placeholderStyles = StyleSheet.create({
  circle: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    backgroundColor: '#fdecec',
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: { fontSize: 20, fontWeight: '700', color: '#e5383b' },
});
