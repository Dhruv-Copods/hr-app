import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, Home } from 'lucide-react';
import { formatEmployeeName } from '@/lib/helpers';
import type { LeaveDayType, Employee, LeaveRecord } from '@/lib/types';

interface TodaysStatusProps {
  todayLeave: Array<{
    employee: Employee;
    leaveType: LeaveDayType;
    leaveRecord: LeaveRecord;
  }>;
  todayWFH: Array<{
    employee: Employee;
    leaveType: LeaveDayType;
    leaveRecord: LeaveRecord;
  }>;
}

export const TodaysStatus: React.FC<TodaysStatusProps> = ({ todayLeave, todayWFH }) => {

  const EmployeeListItem = ({ employee, leaveType }: { employee: Employee; leaveType: 'leave' | 'wfh' }) => (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="flex items-center space-x-3">
        <div className={`w-3 h-3 rounded-full ${leaveType === 'leave' ? 'bg-red-500' : 'bg-blue-500'}`} />
        <div>
          <p className="font-medium text-sm text-gray-900">
            {formatEmployeeName(employee.name)}
          </p>
          <p className="text-xs text-gray-500">
            {employee.designation} • {employee.department}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* On Leave Today */}
      <Card className="border-red-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <div>
            <CardTitle className="text-lg font-semibold text-red-700">On Leave Today</CardTitle>
            <CardDescription className="text-red-600">
              {todayLeave.length} {todayLeave.length === 1 ? 'employee' : 'employees'} on leave
            </CardDescription>
          </div>
          <CalendarDays className="h-5 w-5 text-red-500" />
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2 max-h-44 overflow-y-auto">
            {todayLeave.length > 0 ? (
              todayLeave.map((item, index) => (
                <EmployeeListItem
                  key={`${item.employee.id}-${index}`}
                  employee={item.employee}
                  leaveType="leave"
                />
              ))
            ) : (
              <div className="text-center py-8">
                <CalendarDays className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No employees on leave today</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Working From Home Today */}
      <Card className="border-blue-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <div>
            <CardTitle className="text-lg font-semibold text-blue-700">Working From Home</CardTitle>
            <CardDescription className="text-blue-600">
              {todayWFH.length} {todayWFH.length === 1 ? 'employee' : 'employees'} working remotely
            </CardDescription>
          </div>
          <Home className="h-5 w-5 text-blue-500" />
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {todayWFH.length > 0 ? (
              todayWFH.map((item, index) => (
                <EmployeeListItem
                  key={`${item.employee.id}-${index}`}
                  employee={item.employee}
                  leaveType="wfh"
                />
              ))
            ) : (
              <div className="text-center py-8">
                <Home className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No employees working from home today</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
