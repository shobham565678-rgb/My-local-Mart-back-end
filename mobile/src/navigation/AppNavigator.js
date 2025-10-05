import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import OTPScreen from '../screens/auth/OTPScreen';
import UserTypeScreen from '../screens/auth/UserTypeScreen';

// Customer Screens
import CustomerHomeScreen from '../screens/customer/HomeScreen';
import StoreListScreen from '../screens/customer/StoreListScreen';
import StoreDetailsScreen from '../screens/customer/StoreDetailsScreen';
import ProductListScreen from '../screens/customer/ProductListScreen';
import ProductDetailsScreen from '../screens/customer/ProductDetailsScreen';
import CartScreen from '../screens/customer/CartScreen';
import CheckoutScreen from '../screens/customer/CheckoutScreen';
import OrdersScreen from '../screens/customer/OrdersScreen';
import OrderDetailsScreen from '../screens/customer/OrderDetailsScreen';
import ProfileScreen from '../screens/customer/ProfileScreen';
import SearchScreen from '../screens/customer/SearchScreen';

// Store Owner Screens
import StoreOwnerHomeScreen from '../screens/store-owner/HomeScreen';
import ProductManagementScreen from '../screens/store-owner/ProductManagementScreen';
import AddProductScreen from '../screens/store-owner/AddProductScreen';
import EditProductScreen from '../screens/store-owner/EditProductScreen';
import StoreSettingsScreen from '../screens/store-owner/StoreSettingsScreen';
import StoreOrdersScreen from '../screens/store-owner/OrdersScreen';
import StoreAnalyticsScreen from '../screens/store-owner/AnalyticsScreen';
import StoreProfileScreen from '../screens/store-owner/ProfileScreen';

// Common Screens
import SplashScreen from '../screens/common/SplashScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

// Customer Tab Navigator
const CustomerTabNavigator = () => {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Stores') {
            iconName = focused ? 'storefront' : 'storefront-outline';
          } else if (route.name === 'Cart') {
            iconName = focused ? 'cart' : 'cart-outline';
          } else if (route.name === 'Orders') {
            iconName = focused ? 'receipt' : 'receipt-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textLight,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
        },
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: theme.colors.white,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={CustomerHomeScreen}
        options={{ title: 'Home' }}
      />
      <Tab.Screen 
        name="Stores" 
        component={StoreListScreen}
        options={{ title: 'Stores' }}
      />
      <Tab.Screen 
        name="Cart" 
        component={CartScreen}
        options={{ title: 'Cart' }}
      />
      <Tab.Screen 
        name="Orders" 
        component={OrdersScreen}
        options={{ title: 'Orders' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

// Store Owner Tab Navigator
const StoreOwnerTabNavigator = () => {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'grid' : 'grid-outline';
          } else if (route.name === 'Products') {
            iconName = focused ? 'cube' : 'cube-outline';
          } else if (route.name === 'Orders') {
            iconName = focused ? 'receipt' : 'receipt-outline';
          } else if (route.name === 'Analytics') {
            iconName = focused ? 'analytics' : 'analytics-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textLight,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
        },
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: theme.colors.white,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={StoreOwnerHomeScreen}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen 
        name="Products" 
        component={ProductManagementScreen}
        options={{ title: 'Products' }}
      />
      <Tab.Screen 
        name="Orders" 
        component={StoreOrdersScreen}
        options={{ title: 'Orders' }}
      />
      <Tab.Screen 
        name="Analytics" 
        component={StoreAnalyticsScreen}
        options={{ title: 'Analytics' }}
      />
      <Tab.Screen 
        name="Settings" 
        component={StoreSettingsScreen}
        options={{ title: 'Settings' }}
      />
    </Tab.Navigator>
  );
};

// Customer Stack Navigator
const CustomerStackNavigator = () => {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: theme.colors.white,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="CustomerTabs" 
        component={CustomerTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="StoreDetails" 
        component={StoreDetailsScreen}
        options={{ title: 'Store Details' }}
      />
      <Stack.Screen 
        name="ProductList" 
        component={ProductListScreen}
        options={{ title: 'Products' }}
      />
      <Stack.Screen 
        name="ProductDetails" 
        component={ProductDetailsScreen}
        options={{ title: 'Product Details' }}
      />
      <Stack.Screen 
        name="Checkout" 
        component={CheckoutScreen}
        options={{ title: 'Checkout' }}
      />
      <Stack.Screen 
        name="OrderDetails" 
        component={OrderDetailsScreen}
        options={{ title: 'Order Details' }}
      />
      <Stack.Screen 
        name="Search" 
        component={SearchScreen}
        options={{ title: 'Search' }}
      />
    </Stack.Navigator>
  );
};

// Store Owner Stack Navigator
const StoreOwnerStackNavigator = () => {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: theme.colors.white,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="StoreOwnerTabs" 
        component={StoreOwnerTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="AddProduct" 
        component={AddProductScreen}
        options={{ title: 'Add Product' }}
      />
      <Stack.Screen 
        name="EditProduct" 
        component={EditProductScreen}
        options={{ title: 'Edit Product' }}
      />
      <Stack.Screen 
        name="StoreProfile" 
        component={StoreProfileScreen}
        options={{ title: 'Store Profile' }}
      />
    </Stack.Navigator>
  );
};

// Auth Stack Navigator
const AuthStackNavigator = () => {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="UserType" component={UserTypeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="OTP" component={OTPScreen} />
    </Stack.Navigator>
  );
};

// Main App Navigator
const AppNavigator = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <SplashScreen />;
  }

  if (!user) {
    return <AuthStackNavigator />;
  }

  if (user.userType === 'customer') {
    return <CustomerStackNavigator />;
  } else if (user.userType === 'store_owner') {
    return <StoreOwnerStackNavigator />;
  }

  return <AuthStackNavigator />;
};

export default AppNavigator;





