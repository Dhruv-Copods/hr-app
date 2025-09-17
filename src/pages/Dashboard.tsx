import React from 'react';
import { TodaysStatus } from '@/components/TodaysStatus';
import { EmployeeStats } from '@/components/EmployeeStats';
import { UpcomingHolidays } from '@/components/UpcomingHolidays';
import { useEmployee } from '@/hooks/EmployeeContext';
import { useLeave } from '@/hooks/LeaveContext';
import { useSettings } from '@/hooks/SettingsContext';
import { normalizeDateToStartOfDay } from '@/lib/helpers';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import type { Employee, LeaveRecord, LeaveDayType } from '@/lib/types';

interface TodayLeaveData {
  employee: Employee;
  leaveType: LeaveDayType;
  leaveRecord: LeaveRecord;
}

export const Dashboard: React.FC = () => {
  // Use data from providers
  const { employees, loading: employeeLoading, error: employeeError } = useEmployee();
  const { leaveRecords, holidays, loading: leaveLoading, error: leaveError } = useLeave();
  const { loading: settingsLoading } = useSettings();

  // Combined loading state from all sources
  const loading = employeeLoading || leaveLoading || settingsLoading;

  // Combined error state
  const error = employeeError || leaveError;

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
  const upcomingHolidays = holidays?.filter(holiday => {
    const holidayDate = new Date(holiday.date);
    const todayDate = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(todayDate.getDate() + 30);

    // Normalize dates to start of day for accurate comparison
    const normalizedHolidayDate = normalizeDateToStartOfDay(holidayDate);
    const normalizedTodayDate = normalizeDateToStartOfDay(todayDate);
    const normalizedThirtyDaysFromNow = normalizeDateToStartOfDay(thirtyDaysFromNow);

    return normalizedHolidayDate >= normalizedTodayDate && normalizedHolidayDate <= normalizedThirtyDaysFromNow;
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) || [];

  const totalEmployees = employees.length;


  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-shrink-0">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">Your HR management dashboard</p>
        </div>
        <div className="flex-1 flex items-center justify-center mt-6">
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-2">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Loading dashboard data...</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-shrink-0">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">Your HR management dashboard</p>
        </div>
        <div className="flex-1 flex items-center justify-center mt-6">
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <h3 className="text-lg font-medium text-red-600 mb-2">Error Loading Data</h3>
                <p className="text-gray-500">{error}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header - Fixed at top */}
      <div className="flex-shrink-0">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Welcome back! Here's your HR management overview for today.
        </p>
      </div>

      {/* Scrollable Dashboard Content */}
      <div className="flex-1 overflow-y-auto mt-6">
        <div className="flex flex-col space-y-6 h-full">
          {/* Today's Status - Primary Focus */}
          <TodaysStatus todayLeave={todayLeave} todayWFH={todayWFH} />

          {/* Employee Statistics */}
          <EmployeeStats
            totalEmployees={totalEmployees}
            departmentStats={departmentStats}
          />

          {/* Upcoming Holidays */}
          <UpcomingHolidays holidays={upcomingHolidays} />
        </div>
      </div>
    </div>
  );
};
