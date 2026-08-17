'use client';

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Globe } from 'lucide-react';

export const LanguageSelector: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="relative inline-block text-left" id="lang-selector-container">
      <label htmlFor="lang-picker" className="sr-only">Choose language</label>
      <div className="flex items-center gap-2 bg-ks-surface text-ks-text border border-ks-border rounded-xl px-3 py-2 shadow-ks-sm">
        <Globe className="w-4 h-4 text-ks-text-secondary" />
        <select
          id="lang-picker"
          value={language}
          onChange={(e) => setLanguage(e.target.value as 'en' | 'hi' | 'gu')}
          className="bg-transparent font-medium focus:outline-none cursor-pointer pr-1 text-sm touch-target"
        >
          <option value="en">English</option>
          <option value="hi">हिंदी (Hindi)</option>
          <option value="gu">ગુજરાતી (Gujarati)</option>
        </select>
      </div>
    </div>
  );
};
