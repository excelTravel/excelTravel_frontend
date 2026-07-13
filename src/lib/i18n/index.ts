import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './locales/en.json';
import kin from './locales/kin.json';

// English + Kinyarwanda. Language is detected from localStorage/navigator and persisted.
void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en }, kin: { translation: kin } },
    fallbackLng: 'en',
    supportedLngs: ['en', 'kin'],
    interpolation: { escapeValue: false },
    detection: { order: ['localStorage', 'navigator'], caches: ['localStorage'] },
  });

export default i18n;
