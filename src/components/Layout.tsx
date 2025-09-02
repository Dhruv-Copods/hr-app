import React from 'react';
import { Sidebar } from '@/components/Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden h-full">
        <main className="flex-1 p-6 overflow-hidden h-full">
          {children}
        </main>
      </div>
    </div>
  );
};
