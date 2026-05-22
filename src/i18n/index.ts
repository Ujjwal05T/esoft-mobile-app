import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as RNLocalize from 'react-native-localize';

import en from './locales/en.json';
import hi from './locales/hi.json';

const LANGUAGE_KEY = '@app_selected_language';

const resources = {
  en: {translation: en},
  hi: {translation: hi},
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {escapeValue: false},
  compatibilityJSON: 'v4',
});

// Async: load persisted language or fall back to device locale
AsyncStorage.getItem(LANGUAGE_KEY).then(saved => {
  if (saved && resources[saved as keyof typeof resources]) {
    i18n.changeLanguage(saved);
  } else {
    const locales = RNLocalize.getLocales();
    const deviceLang = locales[0]?.languageCode ?? 'en';
    if (resources[deviceLang as keyof typeof resources]) {
      i18n.changeLanguage(deviceLang);
    }
  }
});

export const changeLanguage = async (lang: string) => {
  await AsyncStorage.setItem(LANGUAGE_KEY, lang);
  await i18n.changeLanguage(lang);
};

export default i18n;
