import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { FileDown, BarChart3, CalendarIcon, Loader2 } from 'lucide-react';
import { format, startOfYear, endOfYear, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { getAllEmployees } from '@/lib/employeeService';
import { getAllLeaveRecords } from '@/lib/leaveService';
import { normalizeDateToStartOfDay } from '@/lib/helpers';
import type { Employee, LeaveRecord } from '@/lib/types';

type ReportFilterType = 'currentFiscalYear' | 'normalYear' | 'specificMonth' | 'monthRange';

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface ReportData {
  employeeName: string;
  employeeId: string;
  leaveDays: number;
  wfhDays: number;
}

export const Reports: React.FC = () => {
  const [filterType, setFilterType] = useState<ReportFilterType>('currentFiscalYear');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveRecords, setLeaveRecords] = useState<LeaveRecord[]>([]);
  const [generatingReport, setGeneratingReport] = useState(false);

  // Load employees and leave records
  useEffect(() => {
    const loadData = async () => {
      try {
        const [employeesData, leaveRecordsData] = await Promise.all([
          getAllEmployees(),
          getAllLeaveRecords()
        ]);
        setEmployees(employeesData);
        setLeaveRecords(leaveRecordsData);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
  }, []);

  // Get current fiscal year (assuming April-March fiscal year)
  const getCurrentFiscalYear = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    // Fiscal year starts in April (month 3)
    return currentMonth >= 3 ? currentYear : currentYear - 1;
  };

  // Get date range based on filter type
  const reportDateRange = useMemo(() => {
    switch (filterType) {
      case 'currentFiscalYear': {
        const fiscalYear = getCurrentFiscalYear();
        return {
          start: new Date(fiscalYear, 3, 1), // April 1st
          end: new Date(fiscalYear + 1, 2, 31), // March 31st next year
        };
      }
      case 'normalYear':
        return {
          start: startOfYear(new Date(selectedYear, 0, 1)),
          end: endOfYear(new Date(selectedYear, 0, 1)),
        };
      case 'specificMonth':
        return {
          start: startOfMonth(new Date(selectedYear, selectedMonth)),
          end: endOfMonth(new Date(selectedYear, selectedMonth)),
        };
      case 'monthRange':
        if (dateRange.from && dateRange.to) {
          return { start: dateRange.from, end: dateRange.to };
        }
        return null;
      default:
        return null;
    }
  }, [filterType, selectedYear, selectedMonth, dateRange]);

  // Generate report data
  const reportData = useMemo((): ReportData[] => {
    if (!reportDateRange || !employees.length || !leaveRecords.length) return [];

    return employees.map(employee => {
      let leaveDays = 0;
      let wfhDays = 0;

      // Filter leave records for this employee
      const employeeLeaveRecords = leaveRecords.filter(
        record => record.employeeId === employee.employeeId
      );

      // Count leave and WFH days within the date range
      employeeLeaveRecords.forEach(record => {
        const recordStart = parseISO(record.startDate);
        const recordEnd = parseISO(record.endDate);

        // Check if record overlaps with the selected date range
        if (recordStart <= reportDateRange.end && recordEnd >= reportDateRange.start) {
          Object.entries(record.days).forEach(([dateStr, dayType]) => {
            const date = parseISO(dateStr);
            // Normalize dates to start of day for accurate comparison
            const normalizedDate = normalizeDateToStartOfDay(date);
            const normalizedRangeStart = normalizeDateToStartOfDay(reportDateRange.start);
            const normalizedRangeEnd = normalizeDateToStartOfDay(reportDateRange.end);

            if (normalizedDate >= normalizedRangeStart && normalizedDate <= normalizedRangeEnd) {
              if (dayType === 'leave') {
                leaveDays++;
              } else if (dayType === 'wfh') {
                wfhDays++;
              }
            }
          });
        }
      });

      return {
        employeeName: employee.name,
        employeeId: employee.employeeId,
        leaveDays,
        wfhDays,
      };
    }).filter(data => data.leaveDays > 0 || data.wfhDays > 0); // Only show employees with leave/WFH
  }, [employees, leaveRecords, reportDateRange]);

  // Export to CSV
  const exportToCSV = () => {
    if (!reportData.length || !reportDateRange) return;

    setGeneratingReport(true);
    try {
      const headers = ['Employee Name', 'Leave Days', 'WFH Days'];
      const csvData = [
        headers,
        ...reportData.map(row => [
          row.employeeName,
          row.leaveDays.toString(),
          row.wfhDays.toString(),
        ])
      ];

      const csvContent = csvData.map(row =>
        row.map(cell => `"${cell}"`).join(',')
      ).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);

      const dateRangeStr = reportDateRange
        ? `${format(reportDateRange.start, 'yyyy-MM-dd')}_${format(reportDateRange.end, 'yyyy-MM-dd')}`
        : 'report';
      link.setAttribute('download', `leave_report_${dateRangeStr}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setGeneratingReport(false);
    }
  };

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
        <p className="mt-2 text-gray-600">Generate and view HR reports and analytics</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Leave Report
          </CardTitle>
          <CardDescription>
            Generate reports showing employee leave and WFH days for selected time periods
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Report Type</label>
              <Select value={filterType} onValueChange={(value: ReportFilterType) => setFilterType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="currentFiscalYear">Current Fiscal Year</SelectItem>
                  <SelectItem value="normalYear">Calendar Year</SelectItem>
                  <SelectItem value="specificMonth">Specific Month</SelectItem>
                  <SelectItem value="monthRange">Date Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(filterType === 'normalYear' || filterType === 'specificMonth') && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Year</label>
                <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map(year => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {filterType === 'specificMonth' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Month</label>
                <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month, index) => (
                      <SelectItem key={index} value={index.toString()}>{month}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {filterType === 'monthRange' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Date Range</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateRange.from && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "LLL dd, y")} -{" "}
                            {format(dateRange.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(dateRange.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange.from}
                      selected={dateRange}
                      onSelect={(range) => {
                        if (range) {
                          setDateRange({ from: range.from, to: range.to });
                        }
                      }}
                      numberOfMonths={2}
                      showOutsideDays={false}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>

          {/* Report Summary */}
          {reportDateRange && (
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Report Period</p>
                <p className="font-medium">
                  {format(reportDateRange.start, 'MMM dd, yyyy')} - {format(reportDateRange.end, 'MMM dd, yyyy')}
                </p>
              </div>
              <Button
                onClick={exportToCSV}
                disabled={reportData.length === 0 || generatingReport}
                className="flex items-center gap-2"
              >
                {generatingReport ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileDown className="h-4 w-4" />
                )}
                Export CSV
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
