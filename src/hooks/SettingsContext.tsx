import { createContext, useContext } from 'react';
import type { CompanySettings, CreateHolidayData } from '@/lib/types';

export interface SettingsContextType {
  settings: CompanySettings | null;
  loading: boolean;
  error: string | null;
  fetchSettings: () => Promise<void>;
  updateLeaveSettings: (settings: Partial<Pick<CompanySettings, 'ptoYearly' | 'ptoMonthly' | 'wfhYearly' | 'wfhMonthly'>>) => Promise<void>;
  addHoliday: (holidayData: CreateHolidayData) => Promise<void>;
  updateHoliday: (holidayId: string, holidayData: CreateHolidayData) => Promise<void>;
  removeHoliday: (holidayId: string) => Promise<void>;
  refreshSettings: () => Promise<void>;
}

export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
