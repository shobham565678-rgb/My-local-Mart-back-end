import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../theme/theme';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('themePreference');
      if (savedTheme) {
        setIsDarkMode(JSON.parse(savedTheme));
      }
    } catch (error) {
      console.error('Load theme preference error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = async () => {
    try {
      const newTheme = !isDarkMode;
      setIsDarkMode(newTheme);
      await AsyncStorage.setItem('themePreference', JSON.stringify(newTheme));
    } catch (error) {
      console.error('Save theme preference error:', error);
    }
  };

  const theme = {
    colors: isDarkMode ? {
      primary: colors.primary,
      secondary: colors.secondary,
      accent: colors.accent,
      background: '#121212',
      surface: '#1E1E1E',
      text: '#FFFFFF',
      textSecondary: '#B0B0B0',
      textLight: '#808080',
      border: '#333333',
      error: colors.error,
      success: colors.success,
      warning: colors.warning,
      info: colors.info,
      white: '#FFFFFF',
      black: '#000000',
    } : {
      primary: colors.primary,
      secondary: colors.secondary,
      accent: colors.accent,
      background: colors.background,
      surface: colors.surface,
      text: colors.text,
      textSecondary: colors.textSecondary,
      textLight: colors.textLight,
      border: colors.border,
      error: colors.error,
      success: colors.success,
      warning: colors.warning,
      info: colors.info,
      white: colors.white,
      black: colors.black,
    },
    isDarkMode,
  };

  const value = {
    theme,
    isDarkMode,
    toggleTheme,
    isLoading,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};





