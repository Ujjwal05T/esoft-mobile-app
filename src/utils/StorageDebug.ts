/**
 * Debug utilities for checking AsyncStorage values
 * Usage: Import and call StorageDebug.logAllKeys() or StorageDebug.getLanguage()
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@app_language_selected';
const LANGUAGE_KEY = '@app_selected_language';

export const StorageDebug = {
  /**
   * Get the currently selected language
   */
  getLanguage: async (): Promise<string | null> => {
    try {
      const language = await AsyncStorage.getItem(LANGUAGE_KEY);
      console.log('📱 Selected Language:', language);
      return language;
    } catch (error) {
      console.error('Error getting language:', error);
      return null;
    }
  },

  /**
   * Check if language has been selected (first-time flag)
   */
  hasSelectedLanguage: async (): Promise<boolean> => {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEY);
      const hasSelected = value === 'true';
      console.log('📱 Has Selected Language:', hasSelected);
      return hasSelected;
    } catch (error) {
      console.error('Error checking language selection:', error);
      return false;
    }
  },

  /**
   * Log all AsyncStorage keys and values
   */
  logAllKeys: async (): Promise<void> => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      console.log('📱 AsyncStorage Keys:', keys);
      
      if (keys.length > 0) {
        const items = await AsyncStorage.multiGet(keys);
        console.log('📱 AsyncStorage Values:');
        items.forEach(([key, value]) => {
          console.log(`  ${key}: ${value}`);
        });
      }
    } catch (error) {
      console.error('Error logging AsyncStorage:', error);
    }
  },

  /**
   * Clear the language selection (for testing - will show language screen again)
   */
  clearLanguageSelection: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      await AsyncStorage.removeItem(LANGUAGE_KEY);
      console.log('📱 Language selection cleared! Restart app to see language screen.');
    } catch (error) {
      console.error('Error clearing language selection:', error);
    }
  },

  /**
   * Clear ALL AsyncStorage (use with caution!)
   */
  clearAll: async (): Promise<void> => {
    try {
      await AsyncStorage.clear();
      console.log('📱 All AsyncStorage cleared!');
    } catch (error) {
      console.error('Error clearing AsyncStorage:', error);
    }
  },
};

export default StorageDebug;
