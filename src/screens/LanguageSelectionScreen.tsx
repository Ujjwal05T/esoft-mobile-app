import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Image,
  useWindowDimensions,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {changeLanguage} from '../i18n';

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
];

const STORAGE_KEY = '@app_language_selected';

const LanguageSelectionScreen: React.FC<LanguageSelectionScreenProps> = ({
  navigation,
}) => {
  const {width, height} = useWindowDimensions();
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);

  const isCompact = height < 700;
  const PADDING = 24;
  const GAP = 14;
  const tileWidth = (width - PADDING * 2 - GAP) / 2;
  const tileHeight = tileWidth * 0.95;

  const handleLanguageSelect = async (languageId: string) => {
    setSelectedLanguage(languageId);
    try {
      await changeLanguage(languageId);
      await AsyncStorage.setItem(STORAGE_KEY, 'true');
      setTimeout(() => {
        if (navigation?.canGoBack()) {
          navigation?.goBack();
        } else {
          navigation?.replace('Login');
        }
      }, 300);
    } catch {
      navigation?.replace('Login');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Logo */}
      <View style={styles.header}>
        <Image
          source={require('../assets/logos/parts_now.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Body */}
      <View style={styles.body}>
        {/* Title block */}
        <View style={styles.titleBlock}>
          <Text style={[styles.title, isCompact && styles.titleCompact]}>
            Select Your Preferred
          </Text>
          <Text style={[styles.title, isCompact && styles.titleCompact]}>
            Language
          </Text>
          <View style={styles.titleUnderline} />
        </View>

        {/* Tiles */}
        <View style={[styles.tilesRow, {gap: GAP, marginTop: isCompact ? 28 : 40}]}>
          {LANGUAGES.map(lang => {
            const isSelected = selectedLanguage === lang.id;
            return (
              <TouchableOpacity
                key={lang.id}
                style={[
                  styles.tile,
                  {width: tileWidth, height: tileHeight},
                  isSelected && styles.tileSelected,
                ]}
                onPress={() => handleLanguageSelect(lang.id)}
                activeOpacity={0.75}>

                {/* Check mark */}
                {isSelected && (
                  <View style={styles.checkBadge}>
                    <Text style={styles.checkMark}>✓</Text>
                  </View>
                )}

                <Text
                  style={[
                    styles.nativeName,
                    {fontSize: tileWidth * 0.17},
                    isSelected && styles.nativeNameSelected,
                  ]}>
                  {lang.nativeName}
                </Text>

                {lang.id !== 'en' && (
                  <Text
                    style={[
                      styles.englishLabel,
                      isSelected && styles.englishLabelSelected,
                    ]}>
                    {lang.name}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Hint */}
        <Text style={[styles.hint, {marginTop: isCompact ? 20 : 28}]}>
          Tap a language to continue
        </Text>
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
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
    justifyContent: 'center',
    alignItems: 'center',
    top: 75,
  },
  logo: {
    width: 186,
    height: 36,
  },
  body: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    paddingBottom: 32,
  },
  titleBlock: {
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  titleCompact: {
    fontSize: 24,
    lineHeight: 30,
  },
  titleUnderline: {
    marginTop: 10,
    width: 44,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#E5383B',
  },
  tilesRow: {
    flexDirection: 'row',
  },
  tile: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#a8a8a8',
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    elevation: 2,
  },
  tileSelected: {
    backgroundColor: '#E5383B',
    borderColor: '#E5383B',
    shadowColor: '#E5383B',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  checkBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    fontSize: 13,
    color: '#ffffff',
    fontWeight: '700',
  },
  nativeName: {
    fontWeight: '700',
    color: '#E5383B',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  nativeNameSelected: {
    color: '#ffffff',
  },
  englishLabel: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '500',
    color: '#888888',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  englishLabelSelected: {
    color: 'rgba(255,255,255,0.75)',
  },
  hint: {
    fontSize: 13,
    color: '#aaaaaa',
    textAlign: 'center',
    letterSpacing: 0.1,
  },
});

export default LanguageSelectionScreen;
