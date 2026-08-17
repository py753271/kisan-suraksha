'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Bell, Map, BookOpen, Settings } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/utils/cn';

export const BottomNav: React.FC = () => {
  const { t } = useLanguage();
  const pathname = usePathname();

  const links = [
    { name: t('home'), path: '/dashboard', icon: Home },
    { name: t('activeAlerts'), path: '/live-alerts', icon: Bell },
    { name: t('mapView'), path: '/interactive-map', icon: Map },
    { name: t('cropAdvisory'), path: '/crop-advisory', icon: BookOpen },
    { name: t('settings'), path: '/settings', icon: Settings }
  ];

  return (
    <nav className="w-full bg-ks-surface text-ks-text border-t border-ks-border shadow-ks-lg fixed bottom-0 left-0 right-0 z-40 md:hidden flex justify-around items-center px-2 py-1">
      {links.map((link) => {
        const Icon = link.icon;
        const isActive = pathname === link.path;

        return (
          <Link
            key={link.path}
            href={link.path}
            className={cn(
              'flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-medium touch-target select-none transition-colors duration-150',
              isActive ? 'text-primary-green font-bold' : 'text-ks-text-secondary'
            )}
          >
            <Icon className={cn('w-5 h-5 mb-0.5', isActive ? 'stroke-[2.5]' : 'stroke-[1.8]')} />
            <span>{link.name}</span>
          </Link>
        );
      })}
    </nav>
  );
};
export default BottomNav;
