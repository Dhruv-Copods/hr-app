import React from 'react';
import { TodaysStatus } from '@/components/TodaysStatus';
import { EmployeeStats } from '@/components/EmployeeStats';
import { UpcomingHolidays } from '@/components/UpcomingHolidays';
import { useDashboardData } from '@/hooks/useDashboardData';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const {
    todayLeave,
    todayWFH,
    totalEmployees,
    departmentStats,
    upcomingHolidays,
    loading,
    error
  } = useDashboardData();


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
        <div className="space-y-6 pb-6">
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
