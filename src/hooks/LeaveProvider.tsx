import React, { useEffect, useState, useCallback } from 'react';
import {
  getAllLeaveRecords,
  getLeaveRecordsByEmployee,
  getLeaveRecordsByDateRange,
  createLeaveRecord as createLeaveRecordService,
  updateLeaveRecord as updateLeaveRecordService,
  deleteLeaveRecord as deleteLeaveRecordService,
  approveLeaveRecord as approveLeaveRecordService,
} from '@/lib/leaveService';
import { getSettings } from '@/lib/settingsService';
import { LeaveContext } from '@/hooks/LeaveContext';
import type { LeaveRecord, CreateLeaveRecordData, UpdateLeaveRecordData, Holiday } from '@/lib/types';
import { toast } from 'sonner';

interface LeaveProviderProps {
  children: React.ReactNode;
}

export const LeaveProvider: React.FC<LeaveProviderProps> = ({ children }) => {
  const [leaveRecords, setLeaveRecords] = useState<LeaveRecord[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllLeaveRecords = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllLeaveRecords();
      setLeaveRecords(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch leave records';
      setError(errorMessage);
      console.error('Error fetching leave records:', err);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLeaveRecordsByEmployee = useCallback(async (employeeId: string): Promise<LeaveRecord[]> => {
    try {
      const records = await getLeaveRecordsByEmployee(employeeId);
      return records;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch leave records for employee';
      console.error('Error fetching leave records by employee:', err);
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  const fetchLeaveRecordsByDateRange = useCallback(async (startDate: string, endDate: string): Promise<LeaveRecord[]> => {
    try {
      const records = await getLeaveRecordsByDateRange(startDate, endDate);
      return records;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch leave records by date range';
      console.error('Error fetching leave records by date range:', err);
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  const getLeaveRecordById = useCallback(async (id: string): Promise<LeaveRecord | null> => {
    try {
      const record = await getLeaveRecordById(id);
      return record;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch leave record';
      console.error('Error fetching leave record by ID:', err);
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  const createLeaveRecord = useCallback(async (data: CreateLeaveRecordData): Promise<LeaveRecord> => {
    try {
      const newRecord = await createLeaveRecordService(data);
      setLeaveRecords(prev => [newRecord, ...prev]);
      toast.success('Leave record created successfully');
      return newRecord;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create leave record';
      console.error('Error creating leave record:', err);
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  const updateLeaveRecord = useCallback(async (id: string, data: UpdateLeaveRecordData): Promise<LeaveRecord> => {
    try {
      const updatedRecord = await updateLeaveRecordService(id, data);
      setLeaveRecords(prev => prev.map(record => record.id === id ? updatedRecord : record));
      toast.success('Leave record updated successfully');
      return updatedRecord;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update leave record';
      console.error('Error updating leave record:', err);
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  const deleteLeaveRecord = useCallback(async (id: string): Promise<void> => {
    try {
      await deleteLeaveRecordService(id);
      setLeaveRecords(prev => prev.filter(record => record.id !== id));
      toast.success('Leave record deleted successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete leave record';
      console.error('Error deleting leave record:', err);
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  const approveLeaveRecord = useCallback(async (id: string, approvedBy: string): Promise<LeaveRecord> => {
    try {
      const approvedRecord = await approveLeaveRecordService(id, approvedBy);
      setLeaveRecords(prev => prev.map(record => record.id === id ? approvedRecord : record));
      toast.success('Leave record approved successfully');
      return approvedRecord;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to approve leave record';
      console.error('Error approving leave record:', err);
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  const fetchHolidays = useCallback(async () => {
    try {
      const settings = await getSettings();
      if (settings) {
        setHolidays(settings.holidays);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch holidays';
      console.error('Error fetching holidays:', err);
      toast.error(errorMessage);
    }
  }, []);

  const getEmployeeLeaveRecords = useCallback((employeeId: string): LeaveRecord[] => {
    return leaveRecords.filter(record => record.employeeId === employeeId);
  }, [leaveRecords]);

  const refreshLeaveRecords = useCallback(async (): Promise<void> => {
    await fetchAllLeaveRecords();
  }, [fetchAllLeaveRecords]);

  // Initial data fetch
  useEffect(() => {
    fetchAllLeaveRecords();
    fetchHolidays();
  }, [fetchAllLeaveRecords, fetchHolidays]);

  const value = {
    leaveRecords,
    holidays,
    loading,
    error,
    fetchAllLeaveRecords,
    fetchLeaveRecordsByEmployee,
    fetchLeaveRecordsByDateRange,
    getLeaveRecordById,
    createLeaveRecord,
    updateLeaveRecord,
    deleteLeaveRecord,
    approveLeaveRecord,
    fetchHolidays,
    getEmployeeLeaveRecords,
    refreshLeaveRecords,
  };

  return (
    <LeaveContext.Provider value={value}>
      {children}
    </LeaveContext.Provider>
  );
};
