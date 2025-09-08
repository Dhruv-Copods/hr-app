import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CalendarDays, Clock, Filter, Calendar, BarChart3 } from 'lucide-react';
import type { Employee, LeaveDayType, Designation } from '@/lib/types';
import { DEPARTMENTS, DESIGNATIONS } from '@/lib/types';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval } from 'date-fns';
import { cn } from '@/lib/utils';
import { useEmployee } from '@/hooks/EmployeeContext';
import { useLeave } from '@/hooks/LeaveContext';
import { useSettings } from '@/hooks/SettingsContext';

interface EmployeeAttendanceData {
  employee: Employee;
  monthlyLeaves: number;
  monthlyWFH: number;
  yearlyLeaves: number;
  yearlyWFH: number;
  remainingLeaves: number;
  remainingWFH: number;
  isOverboardLeaves: boolean;
  isOverboardWFH: boolean;
  monthlyRemainingLeaves?: number;
  monthlyRemainingWFH?: number;
  isOverboardMonthlyLeaves?: boolean;
  isOverboardMonthlyWFH?: boolean;
}

export const Attendance: React.FC = () => {
  const { employees } = useEmployee();
  const { leaveRecords, loading: leaveLoading } = useLeave();
  const { settings, loading: settingsLoading } = useSettings();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [viewMode, setViewMode] = useState<'monthly' | 'yearly'>('monthly');
  const [filters, setFilters] = useState({
    department: 'all',
    designation: 'all',
    search: '',
  });

  // Combined loading state from both providers
  const isLoading = leaveLoading || settingsLoading;

  // Calculate attendance data for each employee
  const calculateEmployeeAttendanceData = (employee: Employee): EmployeeAttendanceData => {
    if (!settings) {
      return {
        employee,
        monthlyLeaves: 0,
        monthlyWFH: 0,
        yearlyLeaves: 0,
        yearlyWFH: 0,
        remainingLeaves: 0,
        remainingWFH: 0,
        isOverboardLeaves: false,
        isOverboardWFH: false,
      };
    }

    const employeeLeaves = leaveRecords.filter(record => record.employeeId === employee.employeeId);

    let monthlyLeaves = 0;
    let monthlyWFH = 0;
    let yearlyLeaves = 0;
    let yearlyWFH = 0;

    // Calculate monthly usage
    if (viewMode === 'monthly') {
      const monthStart = startOfMonth(new Date(selectedYear, selectedMonth - 1));
      const monthEnd = endOfMonth(new Date(selectedYear, selectedMonth - 1));

    // Use a Map to deduplicate days and ensure each day is counted only once
    const monthlyDays = new Map<string, LeaveDayType>();

    employeeLeaves.forEach(record => {
      Object.entries(record.days).forEach(([dateStr, type]) => {
        const date = new Date(dateStr);
        if (isWithinInterval(date, { start: monthStart, end: monthEnd })) {
          monthlyDays.set(dateStr, type);
        }
      });
    });

    // Count the unique days
    monthlyDays.forEach(type => {
      if (type === 'leave') monthlyLeaves++;
      else if (type === 'wfh') monthlyWFH++;
    });
    }

    // Calculate yearly usage (year-to-date for monthly view, full year for yearly view)
    const yearStart = startOfYear(new Date(selectedYear, 0));
    const yearEnd = viewMode === 'monthly'
      ? endOfMonth(new Date(selectedYear, selectedMonth - 1)) // Year-to-date up to selected month
      : endOfYear(new Date(selectedYear, 0)); // Full year

    // Use a Map to deduplicate days and ensure each day is counted only once
    const yearlyDays = new Map<string, LeaveDayType>();

    employeeLeaves.forEach(record => {
      Object.entries(record.days).forEach(([dateStr, type]) => {
        const date = new Date(dateStr);
        if (isWithinInterval(date, { start: yearStart, end: yearEnd })) {
          yearlyDays.set(dateStr, type);
        }
      });
    });

    // Count the unique days
    yearlyDays.forEach(type => {
      if (type === 'leave') yearlyLeaves++;
      else if (type === 'wfh') yearlyWFH++;
    });

    // Calculate remaining leaves
    const remainingLeaves = settings.ptoYearly - yearlyLeaves;
    const remainingWFH = settings.wfhYearly - yearlyWFH;

    // Calculate monthly remaining balances when in monthly view
    let monthlyRemainingLeaves: number | undefined;
    let monthlyRemainingWFH: number | undefined;
    let isOverboardMonthlyLeaves: boolean | undefined;
    let isOverboardMonthlyWFH: boolean | undefined;

    if (viewMode === 'monthly') {
      monthlyRemainingLeaves = settings.ptoMonthly - monthlyLeaves;
      monthlyRemainingWFH = settings.wfhMonthly - monthlyWFH;
      isOverboardMonthlyLeaves = monthlyRemainingLeaves < 0;
      isOverboardMonthlyWFH = monthlyRemainingWFH < 0;
    }

    return {
      employee,
      monthlyLeaves,
      monthlyWFH,
      yearlyLeaves,
      yearlyWFH,
      remainingLeaves,
      remainingWFH,
      isOverboardLeaves: remainingLeaves < 0,
      isOverboardWFH: remainingWFH < 0,
      monthlyRemainingLeaves,
      monthlyRemainingWFH,
      isOverboardMonthlyLeaves,
      isOverboardMonthlyWFH,
    };
  };

  // Filter employees based on current filters
  const filteredEmployees = employees.filter(employee => {
    const matchesDepartment = filters.department === 'all' || employee.department === filters.department;
    const matchesDesignation = filters.designation === 'all' || employee.designation === filters.designation;
    const matchesSearch = !filters.search ||
      employee.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      employee.employeeId.toLowerCase().includes(filters.search.toLowerCase());

    return matchesDepartment && matchesDesignation && matchesSearch;
  });

  // Calculate attendance data for filtered employees
  const attendanceData = filteredEmployees.map(calculateEmployeeAttendanceData);

  // Get departments and designations for filters
  const departments = DEPARTMENTS;
  const designations = [...DESIGNATIONS].sort();

  // Generate years for dropdown (current year ± 5 years)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex justify-center items-center h-full">
          <div className="text-center">
            <Clock className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <span className="text-gray-600">Loading attendance data...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Attendance Sheet</h1>
          <p className="mt-2 text-gray-600">Track employee leaves, WFH, and remaining balances</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex-shrink-0">
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row lg:flex-wrap gap-4 items-start lg:items-center">
              {/* View Mode Toggle */}
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">View:</Label>
                <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'monthly' | 'yearly')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="monthly" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Monthly
                    </TabsTrigger>
                    <TabsTrigger value="yearly" className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Yearly
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Date Selectors */}
              <div className="flex items-center gap-4">
                {viewMode === 'monthly' && (
                  <>
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-medium">Month:</Label>
                      <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => (
                            <SelectItem key={i + 1} value={(i + 1).toString()}>
                              {format(new Date(2024, i, 1), 'MMMM')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-medium">Year:</Label>
                      <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {years.map(year => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                {viewMode === 'yearly' && (
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium">Year:</Label>
                    <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map(year => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Filters */}
              <div className="flex items-center gap-4 flex-1">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <Label className="text-sm font-medium">Filters:</Label>
                </div>

                <Select value={filters.department} onValueChange={(value) => setFilters(prev => ({ ...prev, department: value }))}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filters.designation} onValueChange={(value) => setFilters(prev => ({ ...prev, designation: value }))}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Designations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Designations</SelectItem>
                    {designations.map((designation: Designation) => (
                      <SelectItem key={designation} value={designation}>{designation}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Search employees..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="flex-1 min-w-0"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employee Table */}
      <div className="flex-1 overflow-hidden">
        <Card className='shadow-none overflow-hidden h-full'>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Employee Attendance
              {viewMode === 'monthly' && (
                <Badge variant="outline" className="ml-2">
                  {format(new Date(selectedYear, selectedMonth - 1), 'MMMM yyyy')}
                </Badge>
              )}
              {viewMode === 'yearly' && (
                <Badge variant="outline" className="ml-2">
                  {selectedYear}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {viewMode === 'monthly'
                ? `Showing monthly leave and WFH usage for ${format(new Date(selectedYear, selectedMonth - 1), 'MMMM yyyy')} with monthly limits (PTO: ${settings?.ptoMonthly || 0}, WFH: ${settings?.wfhMonthly || 0})`
                : `Showing yearly leave and WFH usage for ${selectedYear}`
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="w-full overflow-hidden">
            {attendanceData.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No employees match the current filters</p>
              </div>
            ) : (
              <div className="rounded-lg border shadow-none overflow-hidden w-full h-full">
                <div className="overflow-y-auto h-full">
                  <table className="w-full caption-bottom text-sm relative" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
                    <TableHeader className="bg-white sticky top-0 z-10">
                      <TableRow>
                        <TableHead className="h-12 px-6 font-semibold text-gray-900 bg-white border-b-1 border-gray-200">Employee</TableHead>
                        <TableHead className="h-12 px-6 font-semibold text-gray-900 bg-white border-b-1 border-gray-200">Department</TableHead>
                        <TableHead className="h-12 px-6 font-semibold text-gray-900 bg-white border-b-1 border-gray-200">Designation</TableHead>
                        <TableHead className="h-12 px-6 font-semibold text-gray-900 bg-white border-b-1 border-gray-200 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <CalendarDays className="h-4 w-4" />
                            Leaves
                          </div>
                        </TableHead>
                        <TableHead className="h-12 px-6 font-semibold text-gray-900 bg-white border-b-1 border-gray-200 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Clock className="h-4 w-4" />
                            WFH
                          </div>
                        </TableHead>
                        {viewMode === 'monthly' ? (
                          <>
                            <TableHead className="h-12 px-6 font-semibold text-gray-900 bg-white border-b-1 border-gray-200 text-center">
                              <div className="flex flex-col items-center gap-1">
                                <span>PTO</span>
                              </div>
                            </TableHead>
                            <TableHead className="h-12 px-6 font-semibold text-gray-900 bg-white border-b-1 border-gray-200 text-center">
                              <div className="flex flex-col items-center gap-1">
                                <span>WFH</span>
                              </div>
                            </TableHead>
                          </>
                        ) : (
                          <>
                            <TableHead className="h-12 px-6 font-semibold text-gray-900 bg-white border-b-1 border-gray-200 text-center">PTO Balance</TableHead>
                            <TableHead className="h-12 px-6 font-semibold text-gray-900 bg-white border-b-1 border-gray-200 text-center">WFH Balance</TableHead>
                          </>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendanceData.map((data, index) => (
                        <TableRow
                          key={data.employee.id}
                          className={`
                            hover:bg-gray-50/50 transition-colors
                            ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/20'}
                          `}
                        >
                          <TableCell className="px-6 py-4 border-b border-gray-200">
                            <div className="font-medium text-gray-900">{data.employee.name}</div>
                          </TableCell>
                          <TableCell className="px-6 py-4 border-b border-gray-200">
                            <Badge variant="secondary" className="text-xs">
                              {data.employee.department}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-6 py-4 border-b border-gray-200 text-sm text-gray-600">
                            {data.employee.designation}
                          </TableCell>
                          <TableCell className="px-6 py-4 border-b border-gray-200 text-center">
                            <div className="font-semibold text-blue-600">
                              {viewMode === 'monthly' ? data.monthlyLeaves : data.yearlyLeaves}
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-4 border-b border-gray-200 text-center">
                            <div className="font-semibold text-purple-600">
                              {viewMode === 'monthly' ? data.monthlyWFH : data.yearlyWFH}
                            </div>
                          </TableCell>
                          {viewMode === 'monthly' ? (
                            <>
                              <TableCell className="px-6 py-4 border-b border-gray-200 text-center">
                                <div className="space-y-1">
                                  <div className={cn(
                                    "font-semibold",
                                    data.monthlyRemainingLeaves !== undefined && data.monthlyRemainingLeaves >= 0 ? "text-green-600" : "text-red-600"
                                  )}>
                                    {data.monthlyRemainingLeaves !== undefined ? data.monthlyRemainingLeaves : data.remainingLeaves}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="px-6 py-4 border-b border-gray-200 text-center">
                                <div className="space-y-1">
                                  <div className={cn(
                                    "font-semibold",
                                    data.monthlyRemainingWFH !== undefined && data.monthlyRemainingWFH >= 0 ? "text-green-600" : "text-red-600"
                                  )}>
                                    {data.monthlyRemainingWFH !== undefined ? data.monthlyRemainingWFH : data.remainingWFH}
                                  </div>
                                  {data.monthlyRemainingWFH !== undefined && data.isOverboardMonthlyWFH && (
                                    <div className="text-xs text-red-500 font-medium">
                                      Monthly limit exceeded
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                            </>
                          ) : (
                            <>
                              <TableCell className="px-6 py-4 border-b border-gray-200 text-center">
                                <span className={cn(
                                  "font-semibold",
                                  data.remainingLeaves >= 0 ? "text-green-600" : "text-red-600"
                                )}>
                                  {data.remainingLeaves}
                                </span>
                              </TableCell>
                              <TableCell className="px-6 py-4 border-b border-gray-200 text-center">
                                <span className={cn(
                                  "font-semibold",
                                  data.remainingWFH >= 0 ? "text-green-600" : "text-red-600"
                                )}>
                                  {data.remainingWFH}
                                </span>
                              </TableCell>
                            </>
                          )}

                      </TableRow>
                    ))}
                    </TableBody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
