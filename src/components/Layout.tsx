import React from 'react';
import { Sidebar } from '@/components/Sidebar';
import { ScrollArea } from '@/components/ui/scroll-area';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1">
          <main className="flex-1 p-6">
            {children}
          </main>
        </ScrollArea>
      </div>
    </div>
  );
};
