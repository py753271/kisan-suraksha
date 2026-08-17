'use client';

import React from 'react';
import Navbar from '@/components/organisms/Navbar';
import BottomNav from '@/components/organisms/BottomNav';
import Sidebar from '@/components/organisms/Sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-ks-bg text-ks-text">
      {/* Desktop Sidebar (hidden on mobile) */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen pb-16 md:pb-0">
        {/* Mobile / General Header (theme toggle and language selection) */}
        <Navbar />

        {/* Dynamic Page Container */}
        <div className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </div>

        {/* Mobile sticky Bottom Nav */}
        <BottomNav />
      </div>
    </div>
  );
};
export default DashboardLayout;
