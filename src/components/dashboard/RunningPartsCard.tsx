import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';

interface ProductItem {
  id: string;
  name: string;
  brand: string;
  partNo: string;
  compatibility: string;
  imageUri?: string;
}

interface RunningPartsCardProps {
  title?: string;
  products?: ProductItem[];
  onCreateRequest?: (productId: string) => void;
}

const defaultProducts: ProductItem[] = [
  {
    id: '1',
    name: 'Oil filter',
    brand: 'Toyota Genuine Parts',
    partNo: '14325354',
    compatibility: 'Compatible Cars: Fortuner, Hilux',
  },
  {
    id: '2',
    name: 'Oil filter',
    brand: 'Toyota Genuine Parts',
    partNo: '14325355',
    compatibility: 'Compatible Cars: Fortuner, Hilux',
  },
  {
    id: '3',
    name: 'Air filter',
    brand: 'Toyota Genuine Parts',
    partNo: '14325356',
    compatibility: 'Compatible Cars: Fortuner, Hilux',
  },
];

export default function RunningPartsCard({
  title = 'Running Parts for Your Workshop',
  products = defaultProducts,
  onCreateRequest,
}: RunningPartsCardProps) {
  const words = title.split(' ');
  const firstLine = words.slice(0, 3).join(' ');
  const secondLine = words.slice(3).join(' ');

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          {firstLine}
          {'\n'}
          {secondLine}
        </Text>
      </View>

      {/* Horizontal Scroll Products */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        snapToInterval={312}
        decelerationRate="fast">
        {products.map(product => (
          <View key={product.id} style={styles.productCard}>
            {/* Product Image */}
            <View style={styles.imageBox}>
              {product.imageUri ? (
                <Image
                  source={{uri: product.imageUri}}
                  style={styles.productImage}
                  resizeMode="contain"
                />
              ) : (
                <Text style={styles.imagePlaceholder}>🔧</Text>
              )}
            </View>

            {/* Product Info */}
            <View style={styles.productInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.productName}>{product.name}</Text>
              </View>
              <Text style={styles.brand}>{product.brand}</Text>
              <Text style={styles.partNo}>Part No - {product.partNo}</Text>
              <Text style={styles.compatibility} numberOfLines={2}>
                {product.compatibility}
              </Text>
              <TouchableOpacity onPress={() => onCreateRequest?.(product.id)}>
                <Text style={styles.createRequestBtn}>CREATE REQUEST</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: '#e5383b',
    borderRadius: 16,
    overflow: 'hidden',
    paddingBottom: 16,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
  },
  title: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 26,
    letterSpacing: -0.5,
  },
  scrollContent: {
    gap: 10,
    paddingHorizontal: 10,
    paddingBottom: 12,
  },
  productCard: {
    width: 300,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    gap: 10,
    overflow: 'hidden',
  },
  imageBox: {
    width: 100,
    height: 100,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  productImage: {
    width: 90,
    height: 90,
  },
  imagePlaceholder: {
    fontSize: 40,
  },
  productInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  productName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  brand: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e5383b',
    marginBottom: 2,
  },
  partNo: {
    fontSize: 13,
    color: '#828282',
    marginBottom: 2,
  },
  compatibility: {
    fontSize: 12,
    color: '#828282',
    lineHeight: 16,
    marginBottom: 8,
  },
  createRequestBtn: {
    fontSize: 14,
    fontWeight: '700',
    color: '#e5383b',
    letterSpacing: 0.5,
  },
});
