import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Clock, CalendarDays } from 'lucide-react';
import { useSettings } from '@/hooks/SettingsContext';
import { LeavePoliciesTab } from '@/components/LeavePoliciesTab';
import { HolidaysTab } from '@/components/HolidaysTab';

export const Settings: React.FC = () => {
  const { settings, loading } = useSettings();

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex justify-center items-center h-full">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <span className="text-gray-600">Loading settings...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex justify-center items-center h-full">
          <div className="text-center">
            <p className="text-gray-600">Failed to load settings. Please refresh the page.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="mt-2 text-gray-600">Manage your HR application settings</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-1">
        <Tabs defaultValue="leave" className="h-full">
          <TabsList className="flex w-fit">
            <TabsTrigger value="leave" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Leave Policies
            </TabsTrigger>
            <TabsTrigger value="holidays" className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Holidays
            </TabsTrigger>
          </TabsList>

          {/* Leave Policies Tab */}
          <TabsContent value="leave">
            <LeavePoliciesTab />
          </TabsContent>

          {/* Holidays Tab */}
          <TabsContent value="holidays">
            <HolidaysTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
