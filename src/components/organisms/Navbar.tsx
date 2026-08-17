'use client';

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSelector } from '../molecules/LanguageSelector';
import { ThemeToggle } from '../molecules/ThemeToggle';
import { Shield } from 'lucide-react';
import Link from 'next/link';

export const Navbar: React.FC = () => {
  const { t } = useLanguage();

  return (
    <header className="w-full bg-ks-surface text-ks-text border-b border-ks-border shadow-ks-sm sticky top-0 z-40 px-4 py-3 flex justify-between items-center">
      <Link href="/dashboard" className="flex items-center gap-2 select-none">
        <Shield className="w-8 h-8 text-primary-green fill-primary-green/10" />
        <div>
          <h1 className="font-heading font-bold text-lg leading-tight">
            {t('appTitle')}
          </h1>
          <p className="text-[10px] text-ks-text-secondary font-medium tracking-tight hidden sm:block">
            {t('tagline')}
          </p>
        </div>
      </Link>

      <div className="flex items-center gap-3">
        <LanguageSelector />
        <ThemeToggle />
      </div>
    </header>
  );
};
export default Navbar;
