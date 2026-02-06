import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import logo
import EtnaLogo from '../assets/logos/etna-logo.svg';

interface LanguageSelectionScreenProps {
  navigation?: any;
}

interface LanguageOption {
  id: string;
  name: string;
  nativeName: string;
}

const LANGUAGES: LanguageOption[] = [
  {id: 'en', name: 'English', nativeName: 'English'},
  {id: 'hi', name: 'Hindi', nativeName: 'हिंदी'},
  {id: 'pa', name: 'Punjabi', nativeName: 'Punjabi'},
  {id: 'mr', name: 'Marathi', nativeName: 'मराठी'},
  {id: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી'},
  {id: 'ur', name: 'Urdu', nativeName: 'اردو'},
  {id: 'ta', name: 'Tamil', nativeName: 'தமிழ்'},
  {id: 'ml', name: 'Malayalam', nativeName: 'മലയാളം'},
  {id: 'mwr', name: 'Marwari', nativeName: 'मारवाड़ी'},
];

const STORAGE_KEY = '@app_language_selected';
const LANGUAGE_KEY = '@app_selected_language';

// Calculate tile size for 3-column grid with gaps
const {width} = Dimensions.get('window');
const HORIZONTAL_PADDING = 16;
const GAP = 16;
const TILE_SIZE = (width - HORIZONTAL_PADDING * 2 - GAP * 2) / 3;

const LanguageSelectionScreen: React.FC<LanguageSelectionScreenProps> = ({
  navigation,
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);

  const handleLanguageSelect = async (languageId: string) => {
    setSelectedLanguage(languageId);

    try {
      // Save the selected language
      await AsyncStorage.setItem(LANGUAGE_KEY, languageId);
      // Mark that language has been selected (for first-time check)
      await AsyncStorage.setItem(STORAGE_KEY, 'true');

      // Log for debugging
      const selectedLang = LANGUAGES.find(l => l.id === languageId);
      console.log('📱 Language Selected:', languageId, '-', selectedLang?.name);

      // Small delay for visual feedback before navigating
      setTimeout(() => {
        navigation?.replace('Login');
      }, 300);
    } catch (error) {
      console.error('Error saving language selection:', error);
      // Still navigate even if storage fails
      navigation?.replace('Login');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Logo */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <EtnaLogo width={100} height={55} />
        </View>
      </View>

      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Select Your Preferred</Text>
        <Text style={styles.title}>Language</Text>
      </View>

      {/* Language Grid */}
      <View style={styles.gridContainer}>
        {LANGUAGES.map(language => {
          const isSelected = selectedLanguage === language.id;
          return (
            <TouchableOpacity
              key={language.id}
              style={[
                styles.languageTile,
                isSelected && styles.languageTileSelected,
              ]}
              onPress={() => handleLanguageSelect(language.id)}
              activeOpacity={0.7}>
              <Text
                style={[
                  styles.languageText,
                  isSelected && styles.languageTextSelected,
                ]}>
                {language.nativeName}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: 16,
    paddingBottom: 8,
  },
  logoContainer: {
    alignItems: 'center',
  },
  titleContainer: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: 32,
    paddingBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#E5383B',
    letterSpacing: 0.41,
    lineHeight: 28,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: HORIZONTAL_PADDING,
    gap: GAP,
  },
  languageTile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#a8a8a8',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  languageTileSelected: {
    backgroundColor: '#E5383B',
    borderColor: '#E5383B',
  },
  languageText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#E5383B',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  languageTextSelected: {
    color: '#ffffff',
  },
});

export default LanguageSelectionScreen;
