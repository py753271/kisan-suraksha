'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Bell, Map, BookOpen, Settings, Shield, AlertTriangle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/utils/cn';

export const Sidebar: React.FC = () => {
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
    <aside className="w-64 bg-ks-surface text-ks-text border-r border-ks-border min-h-screen hidden md:flex flex-col shrink-0 sticky top-0 z-30">
      {/* Brand Icon & Logo */}
      <div className="p-6 border-b border-ks-border flex items-center gap-2">
        <Shield className="w-8 h-8 text-primary-green fill-primary-green/10" />
        <div>
          <h1 className="font-heading font-bold text-lg leading-tight text-primary-green">
            Kisan Suraksha
          </h1>
          <p className="text-[10px] text-ks-text-secondary">
            Disaster Preparedness
          </p>
        </div>
      </div>

      {/* Navigation list */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.path;

          return (
            <Link
              key={link.path}
              href={link.path}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition duration-150',
                'hover:bg-ks-border/20 active:scale-98',
                isActive ? 'bg-primary-green text-white shadow-ks-sm' : 'text-ks-text-secondary'
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{link.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Emergency Fast Switch */}
      <div className="p-4 border-t border-ks-border">
        <Link
          href="/emergency"
          className="flex items-center justify-center gap-2 w-full bg-critical-red hover:bg-critical-red/90 text-white font-bold py-3 rounded-xl shadow-ks-sm text-sm animate-pulse active:scale-98"
        >
          <AlertTriangle className="w-4 h-4" />
          <span>{t('emergencySOS')}</span>
        </Link>
      </div>
    </aside>
  );
};
export default Sidebar;
