import { createContext, useContext } from 'react';
import type { LeaveRecord, CreateLeaveRecordData, UpdateLeaveRecordData, Holiday } from '@/lib/types';

export interface LeaveContextType {
  // State
  leaveRecords: LeaveRecord[];
  holidays: Holiday[];
  loading: boolean;
  error: string | null;

  // Leave Records CRUD
  fetchAllLeaveRecords: () => Promise<void>;
  fetchLeaveRecordsByEmployee: (employeeId: string) => Promise<LeaveRecord[]>;
  fetchLeaveRecordsByDateRange: (startDate: string, endDate: string) => Promise<LeaveRecord[]>;
  getLeaveRecordById: (id: string) => Promise<LeaveRecord | null>;
  createLeaveRecord: (data: CreateLeaveRecordData) => Promise<LeaveRecord>;
  updateLeaveRecord: (id: string, data: UpdateLeaveRecordData) => Promise<LeaveRecord>;
  deleteLeaveRecord: (id: string) => Promise<void>;
  approveLeaveRecord: (id: string, approvedBy: string) => Promise<LeaveRecord>;

  // Holidays
  fetchHolidays: () => Promise<void>;

  // Utility functions
  getEmployeeLeaveRecords: (employeeId: string) => LeaveRecord[];
  refreshLeaveRecords: () => Promise<void>;
}

export const LeaveContext = createContext<LeaveContextType | undefined>(undefined);

export const useLeave = () => {
  const context = useContext(LeaveContext);
  if (context === undefined) {
    throw new Error('useLeave must be used within a LeaveProvider');
  }
  return context;
};
