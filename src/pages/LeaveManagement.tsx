import React, { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { CalendarIcon, Plus, Search, X, Check } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { Employee, LeaveDayType, CreateLeaveRecordData, LeaveRecord } from '@/lib/types';
import { isHoliday, isOptionalHoliday, isDateDisabled } from '@/lib/helpers';
import { useEmployee } from '@/hooks/EmployeeContext';
import { useLeave } from '@/hooks/LeaveContext';

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface DaySelection {
  [date: string]: LeaveDayType;
}

export const LeaveManagement: React.FC = () => {
  const { employees } = useEmployee();
  const {
    holidays,
    createLeaveRecord,
    fetchLeaveRecordsByEmployee
  } = useLeave();

  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [daySelections, setDaySelections] = useState<DaySelection>({});
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [existingLeaveRecords, setExistingLeaveRecords] = useState<LeaveRecord[]>([]);

  // Search functionality states
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const fetchExistingLeaveRecords = async (employeeId: string) => {
    try {
      const records = await fetchLeaveRecordsByEmployee(employeeId);
      setExistingLeaveRecords(records);
    } catch (error) {
      console.error('Error fetching existing leave records:', error);
    }
  };


  const hasConflictingDates = (): boolean => {
    if (!dateRange.from || !dateRange.to) return false;

    const current = new Date(dateRange.from);
    while (current <= dateRange.to) {
      // Skip holidays when checking for conflicts
      if (!isHoliday(current, holidays) && isDateDisabled(current, existingLeaveRecords, holidays)) {
        return true;
      }
      current.setDate(current.getDate() + 1);
    }

    return false;
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
    const isDisabled = isDateDisabled(date, existingLeaveRecords, holidays);
    const holiday = isHoliday(date, holidays);
    const optionalHoliday = isOptionalHoliday(date, holidays);

    if (isDisabled && !holiday) {
      return <Badge className="bg-red-100 text-red-800 border-red-200">Already Booked</Badge>;
    }

    if (holiday) {
      return <Badge className="bg-red-100 text-red-800 border-red-200" title={holiday.name}>
        Holiday
      </Badge>;
    }

    if (optionalHoliday) {
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200" title={optionalHoliday.name}>
        Optional Holiday
      </Badge>;
    }

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

    // Check if a valid employee is selected
    const selectedEmp = getSelectedEmployee();
    if (!selectedEmp || !selectedEmp.id || !dateRange.from || !dateRange.to) {
      toast.error('Please select a valid employee and date range');
      return;
    }

    if (Object.keys(daySelections).length === 0) {
      toast.error('Please select at least one day');
      return;
    }

    try {
      setSubmitting(true);

      // Build leave data conditionally to avoid undefined values
      const baseLeaveData = {
        employeeId: selectedEmp.employeeId,
        startDate: format(dateRange.from, 'yyyy-MM-dd'),
        endDate: format(dateRange.to, 'yyyy-MM-dd'),
        days: daySelections,
      };

      // Only include reason if it has a value
      const trimmedReason = reason.trim();
      const leaveData: CreateLeaveRecordData = trimmedReason
        ? { ...baseLeaveData, reason: trimmedReason }
        : baseLeaveData;

      await createLeaveRecord(leaveData);

      // Reset form
      setSelectedEmployee('');
      setSearchQuery('');
      setDateRange({ from: undefined, to: undefined });
      setDaySelections({});
      setReason('');
      setIsSearchOpen(false);
      setSelectedIndex(-1);

      // Refresh existing leave records for the employee
      if (selectedEmp.employeeId) {
        await fetchExistingLeaveRecords(selectedEmp.employeeId);
      }
    } catch (error) {
      console.error('Error creating leave record:', error);
      toast.error('Failed to create leave record. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter employees based on search query
  const filteredEmployees = employees.filter(employee =>
    employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    employee.officialEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    employee.department?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle employee selection from suggestions
  const handleEmployeeSelect = (employee: Employee) => {
    if (!employee.id) {
      toast.error('Selected employee does not have a valid ID');
      return;
    }

    setSelectedEmployee(employee.id);
    setSearchQuery(employee.name);
    setIsSearchOpen(false);
    setSelectedIndex(-1);
    // Fetch existing leave records for this employee using employeeId
    fetchExistingLeaveRecords(employee.employeeId);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Only handle navigation keys when suggestions are open
    if (!isSearchOpen) {
      // Allow Escape to close suggestions even when not open
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setSelectedIndex(-1);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < filteredEmployees.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < filteredEmployees.length) {
          handleEmployeeSelect(filteredEmployees[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsSearchOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedEmployee('');
    setSearchQuery('');
    setIsSearchOpen(false);
    setSelectedIndex(-1);
    setExistingLeaveRecords([]);
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
        <div className="flex flex-col gap-6 overflow-auto">
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
                  <div className="relative">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                      <Input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search employees by name, email, or department..."
                        value={searchQuery}
                        onChange={(e) => {
                          const value = e.target.value;
                          setSearchQuery(value);
                          setSelectedIndex(-1);
                          setIsSearchOpen(value.length > 0);
                        }}
                        onKeyDown={handleKeyDown}
                        onFocus={() => {
                          if (searchQuery.length > 0) {
                            setIsSearchOpen(true);
                          }
                        }}
                        onBlur={(e) => {
                          // Don't close if clicking on suggestions
                          const relatedTarget = e.relatedTarget as HTMLElement;
                          if (relatedTarget && relatedTarget.closest('[data-suggestions]')) {
                            return;
                          }
                          setTimeout(() => setIsSearchOpen(false), 100);
                        }}
                        className="pl-10 pr-10"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={clearSelection}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 hover:text-gray-600 z-10"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    {/* Custom Suggestions Dropdown */}
                    {isSearchOpen && (
                      <div
                        data-suggestions
                        className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
                      >
                        {filteredEmployees.length > 0 ? (
                          <div className="py-1">
                            {filteredEmployees.map((employee, index) => (
                              <button
                                key={employee.id}
                                type="button"
                                className={cn(
                                  "w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none flex items-center justify-between",
                                  selectedIndex === index && "bg-blue-50"
                                )}
                                onClick={() => handleEmployeeSelect(employee)}
                                onMouseEnter={() => setSelectedIndex(index)}
                              >
                                <div className="flex flex-col">
                                  <span className="font-medium text-gray-900">{employee.name}</span>
                                  <span className="text-sm text-gray-500">
                                    {employee.officialEmail} • {employee.department}
                                  </span>
                                </div>
                                {selectedEmployee === employee.id && (
                                  <Check className="h-4 w-4 text-blue-600" />
                                )}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="px-3 py-2 text-sm text-gray-500">
                            No employees found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
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
                        disabled={(date) => isDateDisabled(date, existingLeaveRecords, holidays)}
                        modifiers={{
                          optionalHoliday: (date) => isOptionalHoliday(date, holidays) !== null,
                        }}
                        modifiersClassNames={{
                          optionalHoliday: "bg-yellow-100 text-yellow-800 font-semibold hover:bg-yellow-200",
                        }}
                        classNames={{
                          disabled: "bg-red-100 text-red-800 font-semibold hover:bg-red-200",
                        }}
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
                  disabled={submitting || !selectedEmployee || !dateRange.from || !dateRange.to || hasConflictingDates()}
                >
                  {submitting ? 'Creating...' : hasConflictingDates() ? 'Cannot Create - Conflicting Dates' : 'Create Leave Record'}
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
                      {getSelectedEmployee()?.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {getSelectedEmployee()?.name}
                    </p>
                    <p className="text-xs text-gray-500">Employee</p>
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
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {/* Holidays */}
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <Label className="text-xs font-medium text-red-700 uppercase tracking-wide">Holidays</Label>
                      <p className="text-lg font-semibold text-red-800 mt-1">
                        {(() => {
                          let holidayCount = 0;
                          const current = new Date(dateRange.from!);
                          while (current <= dateRange.to!) {
                            if (isHoliday(current, holidays)) {
                              holidayCount++;
                            }
                            current.setDate(current.getDate() + 1);
                          }
                          return holidayCount;
                        })()}
                      </p>
                      <p className="text-xs text-red-600">holidays</p>
                    </div>

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
                            if (current.getDay() !== 0 && current.getDay() !== 6 && !isHoliday(current, holidays)) {
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
                          return type === 'leave' && date.getDay() !== 0 && date.getDay() !== 6 && !isHoliday(date, holidays);
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
                          return type === 'wfh' && date.getDay() !== 0 && date.getDay() !== 6 && !isHoliday(date, holidays);
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
                    const isDisabled = isDateDisabled(currentDate, existingLeaveRecords, holidays);

                    days.push(
                      <div key={dateKey} className={`flex items-center justify-between p-3 border rounded-lg ${
                        isWeekend ? 'bg-orange-50 border-orange-200' : ''
                      } ${
                        isDisabled ? 'bg-red-50 border-red-200' : ''
                      } ${
                        isHoliday(currentDate, holidays) ? 'bg-red-50 border-red-200' : ''
                      } ${
                        isOptionalHoliday(currentDate, holidays) ? 'bg-yellow-50 border-yellow-200' : ''
                      }`}>
                        <div className="flex items-center gap-3">
                          <span className={`font-medium ${
                            isWeekend ? 'text-orange-800' :
                            isHoliday(currentDate, holidays) ? 'text-red-800' :
                            isOptionalHoliday(currentDate, holidays) ? 'text-yellow-800' : ''
                          }`}>
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
                            disabled={isWeekend || isDisabled}
                          >
                            Leave
                          </Button>
                          <Button
                            size="sm"
                            variant={dayType === 'wfh' ? 'default' : 'outline'}
                            className={dayType === 'wfh' ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' : ''}
                            onClick={() => handleDayTypeChange(currentDate, 'wfh')}
                            disabled={isWeekend || isDisabled}
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
