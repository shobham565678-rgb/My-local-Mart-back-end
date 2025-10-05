import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { storesAPI, productsAPI } from '../../services/api';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme/theme';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { totalItems } = useCart();

  const [nearbyStores, setNearbyStores] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Mock location for demo (in real app, get from GPS)
      const mockLocation = { latitude: 28.6139, longitude: 77.2090 }; // Delhi
      
      // Load nearby stores
      const storesResult = await storesAPI.getNearbyStores(
        mockLocation.latitude,
        mockLocation.longitude,
        10
      );
      
      if (storesResult.success) {
        setNearbyStores(storesResult.data.stores.slice(0, 5));
      }

      // Load featured products
      const productsResult = await productsAPI.getProducts({
        status: 'active',
        limit: 10,
        sortBy: 'rating.average',
        sortOrder: 'desc'
      });
      
      if (productsResult.success) {
        setFeaturedProducts(productsResult.data.products.slice(0, 8));
      }
    } catch (error) {
      console.error('Load data error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const categories = [
    { id: '1', name: 'Fruits & Vegetables', icon: '🥬', color: colors.success },
    { id: '2', name: 'Groceries', icon: '🛒', color: colors.primary },
    { id: '3', name: 'Dairy & Eggs', icon: '🥛', color: colors.info },
    { id: '4', name: 'Meat & Seafood', icon: '🥩', color: colors.error },
  ];

  const renderCategoryCard = (category) => (
    <TouchableOpacity
      key={category.id}
      style={[styles.categoryCard, { backgroundColor: theme.colors.surface }, shadows.sm]}
      onPress={() => navigation.navigate('ProductList', { category: category.name })}
    >
      <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
        <Text style={styles.categoryIconText}>{category.icon}</Text>
      </View>
      <Text style={[styles.categoryName, { color: theme.colors.text }]}>
        {category.name}
      </Text>
    </TouchableOpacity>
  );

  const renderStoreCard = (store) => (
    <TouchableOpacity
      key={store._id}
      style={[styles.storeCard, { backgroundColor: theme.colors.surface }, shadows.sm]}
      onPress={() => navigation.navigate('StoreDetails', { storeId: store._id })}
    >
      <View style={styles.storeImage}>
        <Text style={styles.storeImagePlaceholder}>🏪</Text>
      </View>
      <View style={styles.storeInfo}>
        <Text style={[styles.storeName, { color: theme.colors.text }]} numberOfLines={1}>
          {store.name}
        </Text>
        <Text style={[styles.storeCategory, { color: theme.colors.textSecondary }]}>
          {store.category}
        </Text>
        <View style={styles.storeRating}>
          <Text style={[styles.ratingText, { color: theme.colors.textLight }]}>
            ⭐ {store.rating?.average?.toFixed(1) || 'New'} • {store.distance?.toFixed(1)}km
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderProductCard = (product) => (
    <TouchableOpacity
      key={product._id}
      style={[styles.productCard, { backgroundColor: theme.colors.surface }, shadows.sm]}
      onPress={() => navigation.navigate('ProductDetails', { productId: product._id })}
    >
      <View style={styles.productImage}>
        <Text style={styles.productImagePlaceholder}>📦</Text>
      </View>
      <View style={styles.productInfo}>
        <Text style={[styles.productName, { color: theme.colors.text }]} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={[styles.productPrice, { color: theme.colors.primary }]}>
          ₹{product.pricing?.sellingPrice || 0}
        </Text>
        <Text style={[styles.productStore, { color: theme.colors.textLight }]} numberOfLines={1}>
          {product.store?.name}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: theme.colors.text }]}>
              Hello, {user?.profile?.firstName || 'Customer'}! 👋
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              What would you like to buy today?
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.cartButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => navigation.navigate('Cart')}
          >
            <Text style={styles.cartIcon}>🛒</Text>
            {totalItems > 0 && (
              <View style={[styles.cartBadge, { backgroundColor: theme.colors.accent }]}>
                <Text style={[styles.cartBadgeText, { color: theme.colors.white }]}>
                  {totalItems}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <TouchableOpacity
          style={[styles.searchBar, { backgroundColor: theme.colors.surface }, shadows.sm]}
          onPress={() => navigation.navigate('Search')}
        >
          <Text style={[styles.searchPlaceholder, { color: theme.colors.textLight }]}>
            🔍 Search products, stores...
          </Text>
        </TouchableOpacity>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Shop by Category
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.categoriesContainer}>
              {categories.map(renderCategoryCard)}
            </View>
          </ScrollView>
        </View>

        {/* Nearby Stores */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Nearby Stores
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Stores')}>
              <Text style={[styles.seeAllText, { color: theme.colors.primary }]}>
                See All
              </Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.storesContainer}>
              {nearbyStores.map(renderStoreCard)}
            </View>
          </ScrollView>
        </View>

        {/* Featured Products */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Featured Products
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('ProductList')}>
              <Text style={[styles.seeAllText, { color: theme.colors.primary }]}>
                See All
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.productsGrid}>
            {featuredProducts.map(renderProductCard)}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  greeting: {
    ...typography.h4,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body2,
  },
  cartButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cartIcon: {
    fontSize: 24,
  },
  cartBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    ...typography.caption,
    fontWeight: 'bold',
    color: colors.white,
  },
  searchBar: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  searchPlaceholder: {
    ...typography.body2,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h5,
    fontWeight: '600',
  },
  seeAllText: {
    ...typography.body2,
    fontWeight: '600',
  },
  categoriesContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  categoryCard: {
    width: 80,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  categoryIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  categoryIconText: {
    fontSize: 24,
  },
  categoryName: {
    ...typography.caption,
    textAlign: 'center',
    lineHeight: 16,
  },
  storesContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  storeCard: {
    width: 200,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  storeImage: {
    height: 100,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  storeImagePlaceholder: {
    fontSize: 40,
  },
  storeInfo: {
    padding: spacing.md,
  },
  storeName: {
    ...typography.body1,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  storeCategory: {
    ...typography.caption,
    textTransform: 'capitalize',
    marginBottom: spacing.xs,
  },
  storeRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    ...typography.caption,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  productCard: {
    width: (width - spacing.lg * 2 - spacing.md) / 2,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  productImage: {
    height: 120,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImagePlaceholder: {
    fontSize: 40,
  },
  productInfo: {
    padding: spacing.md,
  },
  productName: {
    ...typography.body2,
    fontWeight: '600',
    marginBottom: spacing.xs,
    lineHeight: 18,
  },
  productPrice: {
    ...typography.body1,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  productStore: {
    ...typography.caption,
  },
});

export default HomeScreen;





