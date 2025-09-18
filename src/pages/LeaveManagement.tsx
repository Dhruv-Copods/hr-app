import React, { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { CalendarIcon, Plus, Search, X, Check, ChevronDown, ChevronRight, Trash } from 'lucide-react';
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

interface LeaveEntry {
  id: string;
  dateRange: DateRange;
  daySelections: DaySelection;
  reason: string;
}

export const LeaveManagement: React.FC = () => {
  const { employees } = useEmployee();
  const {
    holidays,
    createLeaveRecord,
    fetchLeaveRecordsByEmployee
  } = useLeave();

  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [leaveEntries, setLeaveEntries] = useState<LeaveEntry[]>([]);
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());
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


  const hasConflictingDates = (entry: LeaveEntry): boolean => {
    if (!entry.dateRange.from || !entry.dateRange.to) return false;

    const current = new Date(entry.dateRange.from);
    while (current <= entry.dateRange.to) {
      // Skip holidays when checking for conflicts
      if (!isHoliday(current, holidays) && isDateDisabled(current, existingLeaveRecords, holidays)) {
        return true;
      }
      current.setDate(current.getDate() + 1);
    }

    return false;
  };

  const addLeaveEntry = () => {
    const newEntry: LeaveEntry = {
      id: `entry-${Date.now()}`,
      dateRange: { from: undefined, to: undefined },
      daySelections: {},
      reason: ''
    };

    // Close all existing entries and open only the new one
    setExpandedEntries(new Set([newEntry.id]));
    setLeaveEntries(prev => [...prev, newEntry]);
  };

  const removeLeaveEntry = (entryId: string) => {
    setLeaveEntries(prev => prev.filter(entry => entry.id !== entryId));
    setExpandedEntries(prev => {
      const newSet = new Set(prev);
      newSet.delete(entryId);
      return newSet;
    });
  };

  const toggleEntryExpansion = (entryId: string) => {
    setExpandedEntries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(entryId)) {
        newSet.delete(entryId);
      } else {
        newSet.add(entryId);
      }
      return newSet;
    });
  };

  const areAllEntriesValid = () => {
    // First check if all entries have date ranges
    if (!leaveEntries.every(entry => entry.dateRange.from && entry.dateRange.to)) {
      return false;
    }

    // Then check for overlapping dates between entries
    const allSelectedDates = new Map<string, number>(); // date -> entry index

    for (let i = 0; i < leaveEntries.length; i++) {
      const entry = leaveEntries[i];
      if (entry.dateRange.from && entry.dateRange.to) {
        const current = new Date(entry.dateRange.from);
        while (current <= entry.dateRange.to!) {
          const dateKey = format(current, 'yyyy-MM-dd');
          if (allSelectedDates.has(dateKey)) {
            return false; // Date already selected in another entry
          }
          allSelectedDates.set(dateKey, i);
          current.setDate(current.getDate() + 1);
        }
      }
    }

    // Finally check for overlaps with existing leave records
    const selectedEmployeeData = getSelectedEmployee();
    if (selectedEmployeeData && existingLeaveRecords.length > 0) {
      for (const entry of leaveEntries) {
        if (entry.dateRange.from && entry.dateRange.to) {
          const current = new Date(entry.dateRange.from);
          while (current <= entry.dateRange.to!) {
            if (isDateDisabled(current, existingLeaveRecords, holidays)) {
              return false; // Date conflicts with existing leave record
            }
            current.setDate(current.getDate() + 1);
          }
        }
      }
    }

    return true;
  };

  const getPreviousEntriesDates = (currentEntryId: string) => {
    const currentIndex = leaveEntries.findIndex(entry => entry.id === currentEntryId);
    const previousEntries = leaveEntries.slice(0, currentIndex);

    const selectedDates = new Set<string>();
    previousEntries.forEach(entry => {
      if (entry.dateRange.from && entry.dateRange.to) {
        const current = new Date(entry.dateRange.from);
        while (current <= entry.dateRange.to!) {
          selectedDates.add(format(current, 'yyyy-MM-dd'));
          current.setDate(current.getDate() + 1);
        }
      }
    });

    return selectedDates;
  };

  const updateLeaveEntry = (entryId: string, updates: Partial<LeaveEntry>) => {
    setLeaveEntries(prev => prev.map(entry =>
      entry.id === entryId ? { ...entry, ...updates } : entry
    ));
  };

  const handleDateSelect = (entryId: string, range: { from?: Date; to?: Date } | undefined) => {
    if (range) {
      const newRange: DateRange = { from: range.from, to: range.to };
      // Initialize day selections for the selected date range
      const selections: DaySelection = {};
      if (range.from && range.to) {
        const current = new Date(range.from);
        while (current <= range.to) {
          const dateKey = format(current, 'yyyy-MM-dd');
          selections[dateKey] = 'leave'; // Default to leave
          current.setDate(current.getDate() + 1);
        }
      }
      updateLeaveEntry(entryId, { dateRange: newRange, daySelections: selections });
    }
  };

  const handleDayTypeChange = useCallback((entryId: string, date: Date, type: LeaveDayType) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    updateLeaveEntry(entryId, {
      daySelections: {
        ...leaveEntries.find(entry => entry.id === entryId)?.daySelections,
        [dateKey]: type
      }
    });
  }, [leaveEntries]);

  const handleReasonChange = (entryId: string, reason: string) => {
    updateLeaveEntry(entryId, { reason });
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if a valid employee is selected
    const selectedEmp = getSelectedEmployee();
    if (!selectedEmp || !selectedEmp.id) {
      toast.error('Please select a valid employee');
      return;
    }

    if (leaveEntries.length === 0) {
      toast.error('Please add at least one leave entry');
      return;
    }

    // Validate each entry
    for (let i = 0; i < leaveEntries.length; i++) {
      const entry = leaveEntries[i];
      if (!entry.dateRange.from || !entry.dateRange.to) {
        toast.error(`Entry ${i + 1}: Please select a valid date range`);
        return;
      }
      if (Object.keys(entry.daySelections).length === 0) {
        toast.error(`Entry ${i + 1}: Please select at least one day`);
        return;
      }
      if (hasConflictingDates(entry)) {
        toast.error(`Entry ${i + 1}: Cannot create - conflicting dates`);
        return;
      }
    }

    try {
      setSubmitting(true);

      // Submit all leave records
      for (const entry of leaveEntries) {
        const baseLeaveData = {
          employeeId: selectedEmp.employeeId,
          startDate: format(entry.dateRange.from!, 'yyyy-MM-dd'),
          endDate: format(entry.dateRange.to!, 'yyyy-MM-dd'),
          days: entry.daySelections,
        };

        // Only include reason if it has a value
        const trimmedReason = entry.reason.trim();
        const leaveData: CreateLeaveRecordData = trimmedReason
          ? { ...baseLeaveData, reason: trimmedReason }
          : baseLeaveData;

        await createLeaveRecord(leaveData);
      }

      toast.success(`Successfully created ${leaveEntries.length} leave record${leaveEntries.length > 1 ? 's' : ''}`);

      // Reset form
      setSelectedEmployee('');
      setSearchQuery('');
      setLeaveEntries([]);
      setIsSearchOpen(false);
      setSelectedIndex(-1);

      // Refresh existing leave records for the employee
      if (selectedEmp.employeeId) {
        await fetchExistingLeaveRecords(selectedEmp.employeeId);
      }
    } catch (error) {
      console.error('Error creating leave records:', error);
      toast.error('Failed to create leave records. Please try again.');
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
    setLeaveEntries([]);
    setExpandedEntries(new Set());
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

      <div className="grid grid-cols-1 lg:grid-cols-[70%_30%] gap-6 flex-1 overflow-hidden">
        {/* Left Column - Create Leave Record and Summary */}
        <div className="flex flex-col gap-2 overflow-auto">
          {/* Leave Form */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create Leave Records
              </CardTitle>
              <CardDescription>
                Select an employee and add multiple leave entries at once
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-4">
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

                {/* Leave Entries */}
                {selectedEmployee && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-medium">Leave Entries</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addLeaveEntry}
                        className="flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Add Entry
                      </Button>
                    </div>

                    {leaveEntries.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                        <Plus className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No leave entries added yet</p>
                        <p className="text-sm">Click "Add Entry" to create your first leave request</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {leaveEntries.map((entry, index) => {
                          const isExpanded = expandedEntries.has(entry.id);
                          const leaveDays = Object.entries(entry.daySelections).filter(([dateKey, type]) => {
                            const date = new Date(dateKey);
                            return type === 'leave' && date.getDay() !== 0 && date.getDay() !== 6 && !isHoliday(date, holidays);
                          }).length;
                          const wfhDays = Object.entries(entry.daySelections).filter(([dateKey, type]) => {
                            const date = new Date(dateKey);
                            return type === 'wfh' && date.getDay() !== 0 && date.getDay() !== 6 && !isHoliday(date, holidays);
                          }).length;

                          return (
                            <Card key={entry.id} className="gap-3">
                              {/* Collapsed Header */}
                              <CardHeader className='gap-0'>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => toggleEntryExpansion(entry.id)}
                                      className="p-1 hover:bg-gray-100"
                                    >
                                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                    </Button>
                                    <CardTitle className="text-sm">Entry {index + 1}</CardTitle>
                                    {entry.dateRange.from && entry.dateRange.to && (
                                      <Badge variant="outline" className="text-xs">
                                        {format(entry.dateRange.from, 'MMM dd')} - {format(entry.dateRange.to, 'MMM dd')}
                                      </Badge>
                                    )}
                                    <div className="flex gap-2">
                                      <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                                        {leaveDays} Leave
                                      </Badge>
                                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                        {wfhDays} WFH
                                      </Badge>
                                    </div>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeLeaveEntry(entry.id)}
                                    className="hover:bg-gray-100"
                                  >
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                </div>
                                {entry.reason && !isExpanded && (
                                  <CardDescription className="ml-7 text-xs">
                                    Reason: {entry.reason}
                                  </CardDescription>
                                )}
                              </CardHeader>

                              {/* Expanded Content */}
                              {isExpanded && (
                                <CardContent className="space-y-4">
                                  {/* Date Range Selection */}
                                  <div className="space-y-2">
                                    <Label>Date Range</Label>
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <Button
                                          variant="outline"
                                          className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !entry.dateRange.from && "text-muted-foreground"
                                          )}
                                        >
                                          <CalendarIcon className="mr-2 h-4 w-4" />
                                          {entry.dateRange.from ? (
                                            entry.dateRange.to ? (
                                              <>
                                                {format(entry.dateRange.from, "LLL dd, y")} -{" "}
                                                {format(entry.dateRange.to, "LLL dd, y")}
                                              </>
                                            ) : (
                                              format(entry.dateRange.from, "LLL dd, y")
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
                                          defaultMonth={entry.dateRange.from}
                                          selected={entry.dateRange}
                                          onSelect={(range) => handleDateSelect(entry.id, range)}
                                          numberOfMonths={2}
                                          showOutsideDays={false}
                                          disabled={(date) => {
                                            const dateKey = format(date, 'yyyy-MM-dd');
                                            const previousEntriesDates = getPreviousEntriesDates(entry.id);
                                            return isDateDisabled(date, existingLeaveRecords, holidays) ||
                                                   isHoliday(date, holidays) !== null ||
                                                   previousEntriesDates.has(dateKey);
                                          }}
                                          modifiers={{
                                            booked: (date) => isDateDisabled(date, existingLeaveRecords, holidays),
                                            holiday: (date) => isHoliday(date, holidays) !== null,
                                            optionalHoliday: (date) => isOptionalHoliday(date, holidays) !== null,
                                            previousEntry: (date) => {
                                              const dateKey = format(date, 'yyyy-MM-dd');
                                              const previousEntriesDates = getPreviousEntriesDates(entry.id);
                                              return previousEntriesDates.has(dateKey);
                                            },
                                          }}
                                          modifiersClassNames={{
                                            booked: "bg-red-100 text-red-800 font-semibold rounded-md",
                                            holiday: "bg-red-100 text-red-800 font-semibold rounded-md",
                                            optionalHoliday: "bg-yellow-100 text-yellow-800 font-semibold rounded-md",
                                            previousEntry: "bg-orange-100 text-orange-800 font-semibold rounded-md",
                                          }}
                                        />
                                      </PopoverContent>
                                    </Popover>
                                  </div>

                                  {/* Reason */}
                                  <div className="space-y-2">
                                    <Label>Reason (Optional)</Label>
                                    <Textarea
                                      placeholder="Reason for leave or WFH"
                                      value={entry.reason}
                                      onChange={(e) => handleReasonChange(entry.id, e.target.value)}
                                      rows={2}
                                    />
                                  </div>

                                  {/* Day Selection Preview */}
                                  {entry.dateRange.from && entry.dateRange.to && (
                                    <div className="space-y-2">
                                      <Label className="text-sm text-gray-600">Day Selection Preview</Label>
                                      <div className="flex flex-col gap-2 max-h-52 overflow-y-auto border rounded-md p-4 bg-gray-50">
                                        {(() => {
                                          const days = [];
                                          const current = new Date(entry.dateRange.from!);
                                          while (current <= entry.dateRange.to!) {
                                            const dateKey = format(current, 'yyyy-MM-dd');
                                            const dayType = entry.daySelections[dateKey] || 'leave';
                                            const currentDate = new Date(current);
                                            const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
                                            const isDisabled = isDateDisabled(currentDate, existingLeaveRecords, holidays);

                                            if (!isWeekend && !isHoliday(currentDate, holidays) && !isDisabled) {
                                              days.push(
                                                <div key={dateKey} className="flex items-center justify-between py-3 px-3 bg-white rounded-lg border text-xs">
                                                  <span className="font-medium">{format(current, 'EEE, MMM dd')}</span>
                                                  <div className="flex gap-2">
                                                    <Button
                                                      type="button"
                                                      size="sm"
                                                      variant={dayType === 'leave' ? 'default' : 'outline'}
                                                      className={dayType === 'leave' ? 'bg-red-50 text-red-700 border-red-200 h-7 px-3 hover:bg-red-50 hover:border-red-200' : 'h-7 px-3 hover:bg-transparent hover:border-gray-300'}
                                                      onClick={() => handleDayTypeChange(entry.id, currentDate, 'leave')}
                                                    >
                                                      Leave
                                                    </Button>
                                                    <Button
                                                      type="button"
                                                      size="sm"
                                                      variant={dayType === 'wfh' ? 'default' : 'outline'}
                                                      className={dayType === 'wfh' ? 'bg-blue-50 text-blue-700 border-blue-200 h-7 px-3 hover:bg-blue-50 hover:border-blue-200' : 'h-7 px-3 hover:bg-transparent hover:border-gray-300'}
                                                      onClick={() => handleDayTypeChange(entry.id, currentDate, 'wfh')}
                                                    >
                                                      WFH
                                                    </Button>
                                                  </div>
                                                </div>
                                              );
                                            }
                                            current.setDate(current.getDate() + 1);
                                          }
                                          return days.length > 0 ? days : <p className="text-xs text-gray-500 text-center py-2">No working days in selected range</p>;
                                        })()}
                                      </div>
                                    </div>
                                  )}
                                </CardContent>
                              )}
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

              </form>
            </CardContent>
          </Card>

          {/* Sticky Submit Button */}
          {selectedEmployee && leaveEntries.length > 0 && (
            <div className="sticky bottom-0 bg-white p-2 rounded-lg">
              <Button
                type="submit"
                className="w-full"
                disabled={submitting || !areAllEntriesValid()}
                onClick={(e) => {
                  // Find the form and submit it
                  const form = e.currentTarget.closest('.flex-col')?.querySelector('form');
                  if (form) form.requestSubmit();
                }}
              >
                {submitting
                  ? 'Creating...'
                  : !leaveEntries.every(entry => entry.dateRange.from && entry.dateRange.to)
                    ? 'Please select date ranges for all entries'
                    : !areAllEntriesValid()
                      ? 'Date conflicts detected - please check for overlaps'
                      : `Create ${leaveEntries.length} Leave Record${leaveEntries.length > 1 ? 's' : ''}`
                }
              </Button>
            </div>
          )}
        </div>

        {/* Right Column - Leave Entries Overview */}
        <Card className="overflow-hidden flex flex-col">
          <CardHeader className="flex-shrink-0">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Leave Entries Overview
            </CardTitle>
            <CardDescription>
              {leaveEntries.length > 0
                ? `Overview of ${leaveEntries.length} leave entr${leaveEntries.length > 1 ? 'ies' : 'y'}`
                : 'Add leave entries to see overview'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
            {leaveEntries.length > 0 ? (
              <div className="space-y-4">
                {leaveEntries.map((entry, index) => (
                  <Card key={entry.id} className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">Entry {index + 1}</CardTitle>
                        <Badge variant="outline" className="text-xs">
                          {entry.dateRange.from && entry.dateRange.to
                            ? `${format(entry.dateRange.from, 'MMM dd')} - ${format(entry.dateRange.to, 'MMM dd')}`
                            : 'No dates'
                          }
                        </Badge>
                      </div>
                      {entry.reason && (
                        <CardDescription className="text-xs">
                          Reason: {entry.reason}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="pt-0">
                      {entry.dateRange.from && entry.dateRange.to ? (
                        <div className="space-y-2">
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div className="p-2 bg-gray-50 rounded text-center">
                              <p className="font-medium text-gray-700">
                                {Object.entries(entry.daySelections).filter(([dateKey, type]) => {
                                  const date = new Date(dateKey);
                                  return type === 'leave' && date.getDay() !== 0 && date.getDay() !== 6 && !isHoliday(date, holidays);
                                }).length}
                              </p>
                              <p className="text-gray-500">Leave Days</p>
                            </div>
                            <div className="p-2 bg-blue-50 rounded text-center">
                              <p className="font-medium text-blue-700">
                                {Object.entries(entry.daySelections).filter(([dateKey, type]) => {
                                  const date = new Date(dateKey);
                                  return type === 'wfh' && date.getDay() !== 0 && date.getDay() !== 6 && !isHoliday(date, holidays);
                                }).length}
                              </p>
                              <p className="text-blue-500">WFH Days</p>
                            </div>
                            <div className="p-2 bg-orange-50 rounded text-center">
                              <p className="font-medium text-orange-700">
                                {(() => {
                                  let holidayCount = 0;
                                  const current = new Date(entry.dateRange.from);
                                  while (current <= entry.dateRange.to) {
                                    if (isHoliday(current, holidays)) {
                                      holidayCount++;
                                    }
                                    current.setDate(current.getDate() + 1);
                                  }
                                  return holidayCount;
                                })()}
                              </p>
                              <p className="text-orange-500">Holidays</p>
                            </div>
                          </div>

                          {/* Day breakdown */}
                          <div className="space-y-1 max-h-60 overflow-y-auto">
                            <Label className="text-xs text-gray-600 font-medium">All Days:</Label>
                            {(() => {
                              const allDays = [];
                              const current = new Date(entry.dateRange.from);
                              while (current <= entry.dateRange.to) {
                                const dateKey = format(current, 'yyyy-MM-dd');
                                const dayType = entry.daySelections[dateKey] || 'leave';
                                const currentDate = new Date(current);
                                const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
                                const holiday = isHoliday(currentDate, holidays);
                                const optionalHoliday = isOptionalHoliday(currentDate, holidays);
                                const isDisabled = isDateDisabled(currentDate, existingLeaveRecords, holidays);

                                // Skip weekends
                                if (isWeekend) {
                                  current.setDate(current.getDate() + 1);
                                  continue;
                                }

                                let badgeContent = '';
                                let badgeClass = '';

                                if (holiday || optionalHoliday) {
                                  // Holiday day
                                  badgeContent = optionalHoliday ? 'Optional Holiday' : 'Holiday';
                                  badgeClass = 'bg-orange-50 text-orange-700 border-orange-200';
                                } else if (!isDisabled) {
                                  // Working day
                                  badgeContent = dayType === 'leave' ? 'Leave' : 'WFH';
                                  badgeClass = dayType === 'leave'
                                    ? 'bg-red-50 text-red-700 border-red-200'
                                    : 'bg-blue-50 text-blue-700 border-blue-200';
                                } else {
                                  // Disabled working day
                                  badgeContent = 'Booked';
                                  badgeClass = 'bg-gray-50 text-gray-700 border-gray-200';
                                }

                                allDays.push(
                                  <div key={dateKey} className="flex items-center justify-between py-2 px-2 bg-gray-50 rounded text-xs">
                                    <span className="font-medium">{format(current, 'EEE, MMM dd')}</span>
                                    <Badge
                                      variant="outline"
                                      className={`text-xs ${badgeClass}`}
                                      title={holiday ? holiday.name : optionalHoliday ? optionalHoliday.name : ''}
                                    >
                                      {badgeContent}
                                    </Badge>
                                  </div>
                                );

                                current.setDate(current.getDate() + 1);
                              }
                              return allDays.length > 0 ? allDays : <p className="text-xs text-gray-500 text-center py-2">No days in range</p>;
                            })()}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4 text-gray-500 text-sm">
                          No date range selected
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="mb-2">No leave entries yet</p>
                <p className="text-sm">Add entries in the form to see the overview</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
