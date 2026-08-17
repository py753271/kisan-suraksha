'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type TextSize = 'normal' | 'large' | 'xlarge';

interface AccessibilityContextType {
  textSize: TextSize;
  setTextSize: (size: TextSize) => void;
  highContrast: boolean;
  setHighContrast: (active: boolean) => void;
  simpleLanguage: boolean;
  setSimpleLanguage: (active: boolean) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [textSize, setTextSizeState] = useState<TextSize>('normal');
  const [highContrast, setHighContrastState] = useState<boolean>(false);
  const [simpleLanguage, setSimpleLanguageState] = useState<boolean>(false);

  useEffect(() => {
    const savedSize = localStorage.getItem('ks_text_size') as TextSize;
    if (savedSize) setTextSizeState(savedSize);

    const savedContrast = localStorage.getItem('ks_high_contrast') === 'true';
    setHighContrastState(savedContrast);
    if (savedContrast) {
      document.body.classList.add('high-contrast');
    }

    const savedSimple = localStorage.getItem('ks_simple_language') === 'true';
    setSimpleLanguageState(savedSimple);
  }, []);

  const setTextSize = (size: TextSize) => {
    setTextSizeState(size);
    localStorage.setItem('ks_text_size', size);
    
    // Manage class on body/html
    document.body.classList.remove('text-size-large', 'text-size-xlarge');
    if (size === 'large') {
      document.body.classList.add('text-size-large');
    } else if (size === 'xlarge') {
      document.body.classList.add('text-size-xlarge');
    }
  };

  const setHighContrast = (active: boolean) => {
    setHighContrastState(active);
    localStorage.setItem('ks_high_contrast', String(active));
    if (active) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
  };

  const setSimpleLanguage = (active: boolean) => {
    setSimpleLanguageState(active);
    localStorage.setItem('ks_simple_language', String(active));
  };

  return (
    <AccessibilityContext.Provider
      value={{
        textSize,
        setTextSize,
        highContrast,
        setHighContrast,
        simpleLanguage,
        setSimpleLanguage
      }}
    >
      <div className={`
        ${textSize === 'large' ? 'text-lg' : ''} 
        ${textSize === 'xlarge' ? 'text-xl' : ''} 
        w-full min-h-screen
      `}>
        {children}
      </div>
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};
