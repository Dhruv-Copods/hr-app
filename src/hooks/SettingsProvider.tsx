import React, { useEffect, useState, useCallback } from 'react';
import { initializeSettings, updateSettings } from '@/lib/settingsService';
import { SettingsContext } from '@/hooks/SettingsContext';
import type { CompanySettings, CreateHolidayData } from '@/lib/types';
import { toast } from 'sonner';

interface SettingsProviderProps {
  children: React.ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await initializeSettings();
      setSettings(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch settings';
      setError(errorMessage);
      console.error('Error fetching settings:', err);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateLeaveSettings = useCallback(async (leaveSettings: Partial<Pick<CompanySettings, 'ptoYearly' | 'ptoMonthly' | 'wfhYearly' | 'wfhMonthly' | 'optionalHolidaysYearly'>>) => {
    if (!settings) return;

    try {
      const updatedSettings = await updateSettings({
        ...settings,
        ...leaveSettings,
      });
      setSettings(updatedSettings);
      toast.success('Leave policies updated successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update leave settings';
      console.error('Error updating leave settings:', err);
      toast.error(errorMessage);
      throw err;
    }
  }, [settings]);

  const addHoliday = useCallback(async (holidayData: CreateHolidayData) => {
    if (!settings) return;

    // Check for duplicate dates
    const existingHoliday = settings.holidays.find(h => h.date === holidayData.date);
    if (existingHoliday) {
      toast.error('A holiday already exists for this date');
      throw new Error('Holiday date already exists');
    }

    try {
      const holiday = {
        id: `holiday-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...holidayData,
      };

      const updatedSettings = await updateSettings({
        ...settings,
        holidays: [...settings.holidays, holiday],
      });

      setSettings(updatedSettings);
      toast.success('Holiday added successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add holiday';
      console.error('Error adding holiday:', err);
      toast.error(errorMessage);
      throw err;
    }
  }, [settings]);

  const updateHoliday = useCallback(async (holidayId: string, holidayData: CreateHolidayData) => {
    if (!settings) return;

    try {
      const updatedHolidays = settings.holidays.map(h =>
        h.id === holidayId
          ? { ...h, ...holidayData }
          : h
      );

      const updatedSettings = await updateSettings({
        ...settings,
        holidays: updatedHolidays,
      });

      setSettings(updatedSettings);
      toast.success('Holiday updated successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update holiday';
      console.error('Error updating holiday:', err);
      toast.error(errorMessage);
      throw err;
    }
  }, [settings]);

  const removeHoliday = useCallback(async (holidayId: string) => {
    if (!settings) return;

    try {
      const updatedHolidays = settings.holidays.filter(h => h.id !== holidayId);
      const updatedSettings = await updateSettings({
        ...settings,
        holidays: updatedHolidays,
      });

      setSettings(updatedSettings);
      toast.success('Holiday removed successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove holiday';
      console.error('Error removing holiday:', err);
      toast.error(errorMessage);
      throw err;
    }
  }, [settings]);

  const refreshSettings = useCallback(async (): Promise<void> => {
    await fetchSettings();
  }, [fetchSettings]);

  // Initial data fetch
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const value = {
    settings,
    loading,
    error,
    fetchSettings,
    updateLeaveSettings,
    addHoliday,
    updateHoliday,
    removeHoliday,
    refreshSettings,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};
