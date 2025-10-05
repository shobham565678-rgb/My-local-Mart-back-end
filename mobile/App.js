import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { QueryClient, QueryClientProvider } from 'react-query';
import Toast from 'react-native-toast-message';

import { AuthProvider } from './src/contexts/AuthContext';
import { CartProvider } from './src/contexts/CartContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';
import { theme } from './src/theme/theme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <PaperProvider theme={theme}>
          <AuthProvider>
            <CartProvider>
              <NavigationContainer>
                <AppNavigator />
                <StatusBar style="auto" />
                <Toast />
              </NavigationContainer>
            </CartProvider>
          </AuthProvider>
        </PaperProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}





