import { useState, useEffect, useCallback } from 'react';
import { getAllEmployees } from '@/lib/employeeService';
import { getAllLeaveRecords } from '@/lib/leaveService';
import { getSettings } from '@/lib/settingsService';
import type { Employee, LeaveRecord, CompanySettings, LeaveDayType, Holiday } from '@/lib/types';

interface TodayLeaveData {
  employee: Employee;
  leaveType: LeaveDayType;
  leaveRecord: LeaveRecord;
}

interface DashboardData {
  employees: Employee[];
  todayLeave: TodayLeaveData[];
  todayWFH: TodayLeaveData[];
  upcomingHolidays: Holiday[];
  totalEmployees: number;
  departmentStats: Record<string, number>;
  loading: boolean;
  error: string | null;
}

export const useDashboardData = (): DashboardData => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveRecords, setLeaveRecords] = useState<LeaveRecord[]>([]);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [employeesData, leaveData, settingsData] = await Promise.all([
        getAllEmployees(),
        getAllLeaveRecords(),
        getSettings()
      ]);

      setEmployees(employeesData);
      setLeaveRecords(leaveData);
      setSettings(settingsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch dashboard data';
      setError(errorMessage);
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculate today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  // Find employees on leave today
  const todayLeave: TodayLeaveData[] = [];
  const todayWFH: TodayLeaveData[] = [];

  leaveRecords.forEach(record => {
    const todayStatus = record.days[today];
    if (todayStatus) {
      const employee = employees.find(emp => emp.employeeId === record.employeeId);
      if (employee) {
        const leaveData = { employee, leaveType: todayStatus, leaveRecord: record };
        if (todayStatus === 'leave') {
          todayLeave.push(leaveData);
        } else if (todayStatus === 'wfh') {
          todayWFH.push(leaveData);
        }
      }
    }
  });

  // Calculate department statistics
  const departmentStats = employees.reduce((acc, employee) => {
    acc[employee.department] = (acc[employee.department] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Get upcoming holidays (next 30 days)
  const upcomingHolidays = settings?.holidays?.filter(holiday => {
    const holidayDate = new Date(holiday.date);
    const todayDate = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(todayDate.getDate() + 30);

    return holidayDate >= todayDate && holidayDate <= thirtyDaysFromNow;
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) || [];

  return {
    employees,
    todayLeave,
    todayWFH,
    upcomingHolidays,
    totalEmployees: employees.length,
    departmentStats,
    loading,
    error,
  };
};
