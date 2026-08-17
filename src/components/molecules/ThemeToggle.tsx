'use client';

import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="touch-target p-3 bg-ks-surface text-ks-text border border-ks-border rounded-xl shadow-ks-sm cursor-pointer hover:bg-ks-border/20 flex items-center justify-center transition duration-150"
      aria-label={theme === 'light' ? 'Switch to Dark Theme' : 'Switch to Light Theme'}
    >
      {theme === 'light' ? <Moon className="w-5 h-5 text-ks-text-secondary" /> : <Sun className="w-5 h-5 text-warning-yellow" />}
    </button>
  );
};
