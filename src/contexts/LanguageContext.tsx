'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'hi' | 'gu';

interface Translations {
  [key: string]: {
    [lang in Language]: string;
  };
}

const translations: Translations = {
  appTitle: { en: 'Kisan Suraksha', hi: 'किसान सुरक्षा', gu: 'કિસાન સુરક્ષા' },
  tagline: { en: 'Official Early Warning & Disaster Intelligence', hi: 'आधिकारिक प्रारंभिक चेतावनी और आपदा खुफिया', gu: 'સત્તાવાર પ્રારંભિક ચેતવણી અને આપત્તિ બુદ્ધિ' },
  languageGateTitle: { en: 'Choose Your Language', hi: 'अपनी भाषा चुनें', gu: 'તમારી ભાષા પસંદ કરો' },
  welcomeMessage: { en: 'Protecting your family, crops, and livestock with official warnings.', hi: 'आधिकारिक चेतावनियों के साथ आपके परिवार, फसलों और पशुधन की सुरक्षा।', gu: 'સત્તાવાર ચેતવણીઓ સાથે તમારા પરિવાર, પાક અને પશુધનની સુરક્ષા.' },
  selectVillage: { en: 'Search Village / District', hi: 'गाँव / जिला खोजें', gu: 'ગામ / જીલ્લો શોધો' },
  currentLocationBtn: { en: 'Use Current GPS Location', hi: 'वर्तमान जीपीएस स्थान का उपयोग करें', gu: 'વર્તમાન જીપીએસ સ્થાનનો ઉપયોગ કરો' },
  or: { en: 'OR', hi: 'अथवा', gu: 'અથવા' },
  riskSafe: { en: 'Normal Status', hi: 'सामान्य स्थिति', gu: 'સામાન્ય સ્થિતિ' },
  riskWarning: { en: 'Alert Status', hi: 'चेतावनी स्थिति', gu: 'ચેતવણી સ્થિતિ' },
  riskDanger: { en: 'Danger Status', hi: 'खतरा स्थिति', gu: 'જોખમ સ્થિતિ' },
  riskCritical: { en: 'Critical Status', hi: 'गंभीर स्थिति', gu: 'ગંભીર સ્થિતિ' },
  activeAlerts: { en: 'Active Alerts', hi: 'सक्रिय चेतावनियाँ', gu: 'સક્રિય ચેતવણીઓ' },
  cropAdvisory: { en: 'Crop Advisory', hi: 'फसल सलाह', gu: 'પાક સલાહ' },
  emergencySOS: { en: 'Emergency SOS', hi: 'आपातकालीन एसओएस', gu: 'આપાતકાલીન એસઓએસ' },
  mapView: { en: 'Live Hazard Map', hi: 'लाइव मानचित्र', gu: 'લાઇવ નકશો' },
  settings: { en: 'Settings', hi: 'सेटिंग्स', gu: 'સેટિંગ્સ' },
  profile: { en: 'Profile', hi: 'प्रोफ़ाइल', gu: 'પ્રોફાઇલ' },
  home: { en: 'Home', hi: 'मुख्य पृष्ठ', gu: 'મુખ્ય પૃષ્ઠ' },
  readOutLoud: { en: 'Listen', hi: 'सुनें', gu: 'સાંભળો' },
  loading: { en: 'Loading...', hi: 'लोड हो रहा है...', gu: 'લોડ થઈ રહ્યું છે...' },
  offlineMessage: { en: 'You are currently offline. Displaying cached weather warnings.', hi: 'आप अभी ऑफ़लाइन हैं। कैश्ड मौसम चेतावनियाँ दिखाई जा रही हैं।', gu: 'તમે અત્યારે ઓફલાઇન છો. કેશ કરેલી હવામાન ચેતવણીઓ દર્શાવવામાં આવી રહી છે.' }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const savedLang = localStorage.getItem('ks_language') as Language;
    if (savedLang && ['en', 'hi', 'gu'].includes(savedLang)) {
      setLanguageState(savedLang);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('ks_language', lang);
    document.documentElement.setAttribute('lang', lang);
  };

  const t = (key: string): string => {
    if (!translations[key]) return key;
    return translations[key][language] || translations[key]['en'];
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
