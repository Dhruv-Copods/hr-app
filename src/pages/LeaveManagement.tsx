import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { EmployeeService } from '@/lib/employeeService';
import { LeaveService } from '@/lib/leaveService';
import type { Employee, LeaveDayType, CreateLeaveRecordData } from '@/lib/types';

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface DaySelection {
  [date: string]: LeaveDayType;
}

export const LeaveManagement: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [daySelections, setDaySelections] = useState<DaySelection>({});
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const data = await EmployeeService.getAllEmployees();
      setEmployees(data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleDateSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (range) {
      const newRange: DateRange = { from: range.from, to: range.to };
      setDateRange(newRange);
      // Initialize day selections for the selected date range
      if (range.from && range.to) {
        const selections: DaySelection = {};
        const current = new Date(range.from);
        while (current <= range.to) {
          const dateKey = format(current, 'yyyy-MM-dd');
          selections[dateKey] = 'leave'; // Default to leave
          current.setDate(current.getDate() + 1);
        }
        setDaySelections(selections);
      }
    }
  };

  const handleDayTypeChange = useCallback((date: Date, type: LeaveDayType) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    setDaySelections(prev => ({
      ...prev,
      [dateKey]: type
    }));
  }, []);

  const getDayTypeBadge = (type: LeaveDayType, date: Date) => {
    const isWeekend = date.getDay() === 0 || date.getDay() === 6; // 0 = Sunday, 6 = Saturday

    if (isWeekend) {
      return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Weekend</Badge>;
    }

    if (type === 'leave') {
      return <Badge className="bg-red-100 text-red-800 border-red-200">Leave</Badge>;
    }
    if (type === 'wfh') {
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200">WFH</Badge>;
    }
    return <Badge variant="outline">Leave</Badge>;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEmployee || !dateRange.from || !dateRange.to) {
      alert('Please select an employee and date range');
      return;
    }

    if (Object.keys(daySelections).length === 0) {
      alert('Please select at least one day');
      return;
    }

    try {
      setSubmitting(true);

      // Build leave data conditionally to avoid undefined values
      const baseLeaveData = {
        employeeId: selectedEmployee,
        startDate: format(dateRange.from, 'yyyy-MM-dd'),
        endDate: format(dateRange.to, 'yyyy-MM-dd'),
        days: daySelections,
        approved: false, // HR will approve later
      };

      // Only include reason if it has a value
      const trimmedReason = reason.trim();
      const leaveData: CreateLeaveRecordData = trimmedReason
        ? { ...baseLeaveData, reason: trimmedReason }
        : baseLeaveData;

      await LeaveService.createLeaveRecord(leaveData);

      // Reset form
      setSelectedEmployee('');
      setDateRange({ from: undefined, to: undefined });
      setDaySelections({});
      setReason('');

      alert('Leave record created successfully!');
    } catch (error) {
      console.error('Error creating leave record:', error);
      alert('Failed to create leave record. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };



  const getSelectedEmployee = () => {
    return employees.find(emp => emp.id === selectedEmployee);
  };

  return (
    <div className="space-y-6 flex flex-col h-full overflow-hidden">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Leave Management</h1>
        <p className="mt-2 text-gray-600">Manage employee leave requests and work-from-home schedules</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 overflow-hidden">
        {/* Left Column - Create Leave Record and Summary */}
        <div className="flex flex-col gap-6">
          {/* Leave Form */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create Leave Record
              </CardTitle>
                          <CardDescription>
              Select dates and mark each day as leave or WFH
            </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Employee Selection */}
                <div className="space-y-2">
                  <Label htmlFor="employee">Employee</Label>
                  <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id!}>
                          {employee.firstName} {employee.lastName} - {employee.employeeId}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Range Selection */}
                <div className="space-y-2">
                  <Label>Date Range</Label>
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
                        onSelect={handleDateSelect}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Reason */}
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason (Optional)</Label>
                  <Textarea
                    id="reason"
                    placeholder="Reason for leave or WFH"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={submitting || !selectedEmployee || !dateRange.from || !dateRange.to}
                >
                  {submitting ? 'Creating...' : 'Create Leave Record'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Summary */}
          {selectedEmployee && dateRange.from && dateRange.to && (
            <Card className="h-fit">
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Employee Info */}
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-gray-700 font-semibold text-xs">
                      {getSelectedEmployee()?.firstName?.[0]}{getSelectedEmployee()?.lastName?.[0]}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {getSelectedEmployee()?.firstName} {getSelectedEmployee()?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">ID: {getSelectedEmployee()?.employeeId}</p>
                  </div>
                </div>

                {/* Date Range & Day Breakdown */}
                <div className="space-y-4">
                  {/* Date Range */}
                  <div className="p-3 border rounded-lg">
                    <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Date Range</Label>
                    <p className="text-sm font-medium text-gray-900 mt-1">
                      {format(dateRange.from, 'MMM dd, yyyy')} to {format(dateRange.to, 'MMM dd, yyyy')}
                    </p>
                  </div>

                  {/* Day Type Breakdown */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {/* Weekends */}
                    <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <Label className="text-xs font-medium text-orange-700 uppercase tracking-wide">Weekends</Label>
                      <p className="text-lg font-semibold text-orange-800 mt-1">
                        {(() => {
                          let weekendCount = 0;
                          const current = new Date(dateRange.from!);
                          while (current <= dateRange.to!) {
                            if (current.getDay() === 0 || current.getDay() === 6) {
                              weekendCount++;
                            }
                            current.setDate(current.getDate() + 1);
                          }
                          return weekendCount;
                        })()}
                      </p>
                      <p className="text-xs text-orange-600">Sat/Sun</p>
                    </div>

                    {/* Working Days */}
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <Label className="text-xs font-medium text-gray-700 uppercase tracking-wide">Working Days</Label>
                      <p className="text-lg font-semibold text-gray-800 mt-1">
                        {(() => {
                          let workingDays = 0;
                          const current = new Date(dateRange.from!);
                          while (current <= dateRange.to!) {
                            if (current.getDay() !== 0 && current.getDay() !== 6) {
                              workingDays++;
                            }
                            current.setDate(current.getDate() + 1);
                          }
                          return workingDays;
                        })()}
                      </p>
                      <p className="text-xs text-gray-600">Mon-Fri</p>
                    </div>

                    {/* Leave Days */}
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <Label className="text-xs font-medium text-red-700 uppercase tracking-wide">Leave Days</Label>
                      <p className="text-lg font-semibold text-red-800 mt-1">
                        {Object.entries(daySelections).filter(([dateKey, type]) => {
                          const date = new Date(dateKey);
                          return type === 'leave' && date.getDay() !== 0 && date.getDay() !== 6;
                        }).length}
                      </p>
                      <p className="text-xs text-red-600">working days</p>
                    </div>

                    {/* WFH Days */}
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <Label className="text-xs font-medium text-blue-700 uppercase tracking-wide">WFH Days</Label>
                      <p className="text-lg font-semibold text-blue-800 mt-1">
                        {Object.entries(daySelections).filter(([dateKey, type]) => {
                          const date = new Date(dateKey);
                          return type === 'wfh' && date.getDay() !== 0 && date.getDay() !== 6;
                        }).length}
                      </p>
                      <p className="text-xs text-blue-600">working days</p>
                    </div>
                  </div>
                </div>


              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Day Selection Calendar */}
        <Card className="overflow-hidden flex flex-col">
          <CardHeader className="flex-shrink-0">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Day Selection
            </CardTitle>
            <CardDescription>
              {dateRange.from && dateRange.to ? (
                `Select leave type for each day from ${format(dateRange.from, 'MMM dd')} to ${format(dateRange.to, 'MMM dd')}`
              ) : (
                'Select a date range first'
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
            {dateRange.from && dateRange.to && (
              <div className="grid grid-cols-1 gap-4">
                {(() => {
                  const days = [];
                  const current = new Date(dateRange.from!);
                  while (current <= dateRange.to!) {
                    const dateKey = format(current, 'yyyy-MM-dd');
                    const dayType = daySelections[dateKey] || 'leave';
                    const currentDate = new Date(current); // Create a copy of the current date
                    const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6; // 0 = Sunday, 6 = Saturday

                    days.push(
                      <div key={dateKey} className={`flex items-center justify-between p-3 border rounded-lg ${
                        isWeekend ? 'bg-orange-50 border-orange-200' : ''
                      }`}>
                        <div className="flex items-center gap-3">
                          <span className={`font-medium ${isWeekend ? 'text-orange-800' : ''}`}>
                            {format(current, 'EEE, MMM dd')}
                          </span>
                          {getDayTypeBadge(dayType, currentDate)}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant={dayType === 'leave' ? 'default' : 'outline'}
                            className={dayType === 'leave' ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100' : ''}
                            onClick={() => handleDayTypeChange(currentDate, 'leave')}
                            disabled={isWeekend}
                          >
                            Leave
                          </Button>
                          <Button
                            size="sm"
                            variant={dayType === 'wfh' ? 'default' : 'outline'}
                            className={dayType === 'wfh' ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' : ''}
                            onClick={() => handleDayTypeChange(currentDate, 'wfh')}
                            disabled={isWeekend}
                          >
                            WFH
                          </Button>
                        </div>
                      </div>
                    );
                    current.setDate(current.getDate() + 1);
                  }
                  return days;
                })()}
              </div>
            )}

            {(!dateRange.from || !dateRange.to) && (
              <div className="text-center py-8 text-gray-500">
                <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a date range to configure leave days</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
