import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import {
  ArrowLeft,
  Mail,
  MapPin,
  User,
  Building,
  Briefcase,
  AlertCircle,
  CheckCircle,
  XCircle,
  Home,
  Coffee,
  Sun,
  CalendarDays,
  BarChart3,
  Edit,
  Trash2,
  FileText
} from 'lucide-react';
import { EmployeeService } from '@/lib/employeeService';
import { LeaveService } from '@/lib/leaveService';
import type { Employee, LeaveRecord } from '@/lib/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export const EmployeeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [leaveRecords, setLeaveRecords] = useState<LeaveRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewType, setViewType] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedQuarter, setSelectedQuarter] = useState(Math.floor(new Date().getMonth() / 3) + 1);
  const [editingRecord, setEditingRecord] = useState<LeaveRecord | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    reason: '',
    days: {} as { [date: string]: 'leave' | 'wfh' | 'present' }
  });

  useEffect(() => {
    if (id) {
      fetchEmployeeData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchEmployeeData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      const [employeeData, leaveData] = await Promise.all([
        EmployeeService.getEmployeeById(id),
        LeaveService.getLeaveRecordsByEmployee(id)
      ]);

      if (!employeeData) {
        setError('Employee not found');
        return;
      }

      setEmployee(employeeData);
      setLeaveRecords(leaveData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch employee data');
    } finally {
      setLoading(false);
    }
  };







  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const calculateLeaveStats = () => {
    const currentYear = new Date().getFullYear();
    const uniqueLeaveDates = new Set<string>();
    const uniqueWfhDates = new Set<string>();

    leaveRecords.forEach(record => {
      Object.entries(record.days).forEach(([dateString, dayType]) => {
        const recordYear = new Date(dateString).getFullYear();
        if (recordYear === currentYear) {
          // Parse date to check if it's a weekend
          const date = new Date(dateString);
          const dayOfWeek = date.getDay();
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday = 0, Saturday = 6
          
          // Only count non-weekend days
          if (!isWeekend) {
            if (dayType === 'leave') uniqueLeaveDates.add(dateString);
            if (dayType === 'wfh') uniqueWfhDates.add(dateString);
          }
        }
      });
    });

    const currentYearRecords = leaveRecords.filter(record => {
      const recordYear = new Date(record.startDate).getFullYear();
      return recordYear === currentYear;
    });

    return { 
      totalLeaveDays: uniqueLeaveDates.size, 
      totalWfhDays: uniqueWfhDates.size, 
      totalRecords: currentYearRecords.length 
    };
  };

  const calculateMonthStats = () => {
    const uniqueLeaveDates = new Set<string>();
    const uniqueWfhDates = new Set<string>();

    leaveRecords.forEach(record => {
      Object.entries(record.days).forEach(([dateString, dayType]) => {
        // Parse date more safely to avoid timezone issues
        const [year, month, day] = dateString.split('-').map(Number);
        const date = new Date(year, month - 1, day); // month is 0-indexed in Date constructor

        if (date.getMonth() === selectedMonth && date.getFullYear() === selectedYear) {
          // Check if it's a weekend
          const dayOfWeek = date.getDay();
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday = 0, Saturday = 6
          
          // Only count non-weekend days
          if (!isWeekend) {
            if (dayType === 'leave') uniqueLeaveDates.add(dateString);
            if (dayType === 'wfh') uniqueWfhDates.add(dateString);
          }
        }
      });
    });

    return { 
      monthLeaveDays: uniqueLeaveDates.size, 
      monthWfhDays: uniqueWfhDates.size 
    };
  };

  const calculateQuarterStats = () => {
    const uniqueLeaveDates = new Set<string>();
    const uniqueWfhDates = new Set<string>();

    // Calculate quarter start and end months
    const quarterStartMonth = (selectedQuarter - 1) * 3;
    const quarterEndMonth = quarterStartMonth + 2;

    leaveRecords.forEach(record => {
      Object.entries(record.days).forEach(([dateString, dayType]) => {
        const [year, month, day] = dateString.split('-').map(Number);
        const date = new Date(year, month - 1, day);

        if (date.getFullYear() === selectedYear && 
            date.getMonth() >= quarterStartMonth && 
            date.getMonth() <= quarterEndMonth) {
          const dayOfWeek = date.getDay();
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
          
          if (!isWeekend) {
            if (dayType === 'leave') uniqueLeaveDates.add(dateString);
            if (dayType === 'wfh') uniqueWfhDates.add(dateString);
          }
        }
      });
    });

    return { 
      quarterLeaveDays: uniqueLeaveDates.size, 
      quarterWfhDays: uniqueWfhDates.size 
    };
  };

  const calculateYearlyStats = () => {
    const uniqueLeaveDates = new Set<string>();
    const uniqueWfhDates = new Set<string>();

    leaveRecords.forEach(record => {
      Object.entries(record.days).forEach(([dateString, dayType]) => {
        const [year, month, day] = dateString.split('-').map(Number);
        const date = new Date(year, month - 1, day);

        if (date.getFullYear() === selectedYear) {
          const dayOfWeek = date.getDay();
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
          
          if (!isWeekend) {
            if (dayType === 'leave') uniqueLeaveDates.add(dateString);
            if (dayType === 'wfh') uniqueWfhDates.add(dateString);
          }
        }
      });
    });

    return { 
      yearlyLeaveDays: uniqueLeaveDates.size, 
      yearlyWfhDays: uniqueWfhDates.size 
    };
  };

  const getDayType = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');

    // Check if it's a weekend
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return { type: 'weekend', icon: Sun, color: 'text-orange-500', bgColor: 'bg-orange-50' };
    }

    // Check leave records for this date
    for (const record of leaveRecords) {
      if (record.days[dateString]) {
        const dayType = record.days[dateString];
        switch (dayType) {
          case 'leave':
            return {
              type: 'leave',
              icon: XCircle,
              color: 'text-red-600',
              bgColor: 'bg-red-50',
              borderColor: 'border-red-200'
            };
          case 'wfh':
            return {
              type: 'wfh',
              icon: Home,
              color: 'text-blue-600',
              bgColor: 'bg-blue-50',
              borderColor: 'border-blue-200'
            };
          case 'present':
            return {
              type: 'present',
              icon: CheckCircle,
              color: 'text-green-600',
              bgColor: 'bg-green-50',
              borderColor: 'border-green-200'
            };
        }
      }
    }

    // Default - regular workday
    return {
      type: 'workday',
      icon: Coffee,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200'
    };
  };

  const generateCalendarDays = () => {
    const days = [];
    const firstDay = new Date(selectedYear, selectedMonth, 1);
    const lastDay = new Date(selectedYear, selectedMonth + 1, 0);
    const numberOfDays = lastDay.getDate();

    // Add empty cells for days before the first day of the month
    const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null); // Empty cell
    }

    // Add all days of the month
    for (let i = 1; i <= numberOfDays; i++) {
      const currentDate = new Date(selectedYear, selectedMonth, i);
      const dayType = getDayType(currentDate);

      days.push({
        date: currentDate,
        isCurrentMonth: true,
        ...dayType
      });
    }

    return days;
  };

  const generateQuarterCalendar = () => {
    const quarterStartMonth = (selectedQuarter - 1) * 3;
    const months = [];

    for (let i = 0; i < 3; i++) {
      const monthIndex = quarterStartMonth + i;
      const days = [];
      const firstDay = new Date(selectedYear, monthIndex, 1);
      const lastDay = new Date(selectedYear, monthIndex + 1, 0);
      const numberOfDays = lastDay.getDate();

      // Add empty cells for days before the first day of the month
      const firstDayOfWeek = firstDay.getDay();
      for (let j = 0; j < firstDayOfWeek; j++) {
        days.push(null);
      }

      // Add all days of the month
      for (let j = 1; j <= numberOfDays; j++) {
        const currentDate = new Date(selectedYear, monthIndex, j);
        const dayType = getDayType(currentDate);

        days.push({
          date: currentDate,
          isCurrentMonth: true,
          ...dayType
        });
      }

      months.push({
        monthIndex,
        monthName: new Date(selectedYear, monthIndex, 1).toLocaleDateString('en-US', { month: 'long' }),
        days
      });
    }

    return months;
  };

  const generateYearlyCalendar = () => {
    const months = [];

    for (let i = 0; i < 12; i++) {
      const days = [];
      const firstDay = new Date(selectedYear, i, 1);
      const lastDay = new Date(selectedYear, i + 1, 0);
      const numberOfDays = lastDay.getDate();

      // Add empty cells for days before the first day of the month
      const firstDayOfWeek = firstDay.getDay();
      for (let j = 0; j < firstDayOfWeek; j++) {
        days.push(null);
      }

      // For yearly view, we'll show a simplified view with just the day numbers and types
      for (let j = 1; j <= numberOfDays; j++) {
        const currentDate = new Date(selectedYear, i, j);
        const dayType = getDayType(currentDate);

        days.push({
          date: currentDate,
          day: j,
          ...dayType
        });
      }

      months.push({
        monthIndex: i,
        monthName: new Date(selectedYear, i, 1).toLocaleDateString('en-US', { month: 'long' }),
        days
      });
    }

    return months;
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const quarters = [
    { value: 1, label: 'Q1 (Jan-Mar)' },
    { value: 2, label: 'Q2 (Apr-Jun)' },
    { value: 3, label: 'Q3 (Jul-Sep)' },
    { value: 4, label: 'Q4 (Oct-Dec)' }
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  const openEditModal = (record: LeaveRecord) => {
    setEditingRecord(record);
    setEditFormData({
      startDate: new Date(record.startDate),
      endDate: new Date(record.endDate),
      reason: record.reason || '',
      days: { ...record.days }
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!editingRecord || !editFormData.startDate || !editFormData.endDate) return;

    try {
      await LeaveService.updateLeaveRecord(editingRecord.id!, {
        startDate: format(editFormData.startDate, 'yyyy-MM-dd'),
        endDate: format(editFormData.endDate, 'yyyy-MM-dd'),
        reason: editFormData.reason,
        days: editFormData.days
      });

      // Refresh leave records
      if (id) {
        const updatedRecords = await LeaveService.getLeaveRecordsByEmployee(id);
        setLeaveRecords(updatedRecords);
      }

      setIsEditModalOpen(false);
      setEditingRecord(null);
    } catch (error) {
      console.error('Error updating leave record:', error);
      setError(error instanceof Error ? error.message : 'Failed to update leave record');
    }
  };

  const handleDeleteLeave = async (recordId: string) => {
    if (!confirm('Are you sure you want to delete this leave record?')) return;

    try {
      await LeaveService.deleteLeaveRecord(recordId);

      // Refresh leave records
      if (id) {
        const updatedRecords = await LeaveService.getLeaveRecordsByEmployee(id);
        setLeaveRecords(updatedRecords);
      }
    } catch (error) {
      console.error('Error deleting leave record:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete leave record');
    }
  };

  const handleDateChange = (date: string, dayType: 'leave' | 'wfh' | 'present') => {
    setEditFormData(prev => ({
      ...prev,
      days: {
        ...prev.days,
        [date]: dayType
      }
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading employee details...</p>
        </div>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {error || 'Employee not found'}
            </h3>
            <Button onClick={() => navigate('/employees')} className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Employees
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = calculateLeaveStats();
  const monthStats = calculateMonthStats();
  const quarterStats = calculateQuarterStats();
  const yearlyStats = calculateYearlyStats();

  // Get current period stats based on view type
  const getCurrentPeriodStats = () => {
    switch (viewType) {
      case 'monthly':
        return {
          leaveDays: monthStats.monthLeaveDays,
          wfhDays: monthStats.monthWfhDays,
          periodLabel: `${months[selectedMonth]} ${selectedYear}`
        };
      case 'quarterly':
        return {
          leaveDays: quarterStats.quarterLeaveDays,
          wfhDays: quarterStats.quarterWfhDays,
          periodLabel: `Q${selectedQuarter} ${selectedYear}`
        };
      case 'yearly':
        return {
          leaveDays: yearlyStats.yearlyLeaveDays,
          wfhDays: yearlyStats.yearlyWfhDays,
          periodLabel: `${selectedYear}`
        };
      default:
        return {
          leaveDays: monthStats.monthLeaveDays,
          wfhDays: monthStats.monthWfhDays,
          periodLabel: `${months[selectedMonth]} ${selectedYear}`
        };
    }
  };

  const currentPeriodStats = getCurrentPeriodStats();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Employee Avatar */}
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-lg font-semibold">
            {employee.name.split(' ').map(n => n[0]).join('').toUpperCase()}
          </div>
          
          {/* Employee Info */}
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {employee.name}
              </h1>
              <Badge variant="secondary" className="text-xs">
                {employee.department}
              </Badge>
            </div>
            <p className="text-sm text-gray-600 mt-1">{employee.designation}</p>
          </div>
        </div>
        
        {/* Action Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/employees')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      <Tabs defaultValue="overview" className="pt-6 overflow-hidden h-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="manage-leaves">Manage Leaves</TabsTrigger>
          <TabsTrigger value="leave-history">Leave Calendar</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-3 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Name</Label>
                  <p className="text-lg">{employee.name}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-500">Official Email</Label>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <p>{employee.officialEmail}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-500">Personal Email</Label>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <p>{employee.personalEmail}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Employment Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Employment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Department</Label>
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-gray-400" />
                    <p>{employee.department}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-500">Designation</Label>
                  <p>{employee.designation}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-500">Date of Joining</Label>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-gray-400" />
                    <p>{formatDate(employee.dateOfJoining)}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-500">Date of Birth</Label>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-gray-400" />
                    <p>{formatDate(employee.dateOfBirth)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Address Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Current Address</Label>
                  <p>{employee.currentAddress}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-500">Permanent Address</Label>
                  <p>{employee.permanentAddress}</p>
                </div>
              </CardContent>
            </Card>


          </div>

          {/* Leave Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Leave Statistics (Current Year)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">{stats.totalLeaveDays}</div>
                  <div className="text-sm text-gray-500">Leave Days</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{stats.totalWfhDays}</div>
                  <div className="text-sm text-gray-500">WFH Days</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-600">{stats.totalRecords}</div>
                  <div className="text-sm text-gray-500">Total Records</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leave-history" className="mt-3 space-y-4 flex flex-col overflow-hidden">
          {/* Stats and Filters Row */}
          <div className="flex items-center justify-between mb-4">
            {/* Stats on Left */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold text-red-600">{currentPeriodStats.leaveDays}</div>
                <div className="text-sm text-gray-600">
                  Leaves {viewType === 'monthly' ? 'This Month' : viewType === 'quarterly' ? 'This Quarter' : 'This Year'}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold text-blue-600">{currentPeriodStats.wfhDays}</div>
                <div className="text-sm text-gray-600">
                  WFH Days {viewType === 'monthly' ? 'This Month' : viewType === 'quarterly' ? 'This Quarter' : 'This Year'}
                </div>
              </div>
            </div>

            {/* Filters on Right */}
            <div className="flex gap-2 flex-wrap">
              {/* View Type Selector */}
              <Select value={viewType} onValueChange={(value: 'monthly' | 'quarterly' | 'yearly') => setViewType(value)}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      Monthly
                    </div>
                  </SelectItem>
                  <SelectItem value="quarterly">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      Quarterly
                    </div>
                  </SelectItem>
                  <SelectItem value="yearly">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Yearly
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Period Selectors based on view type */}
              {viewType === 'monthly' && (
                <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {viewType === 'quarterly' && (
                <Select value={selectedQuarter.toString()} onValueChange={(value) => setSelectedQuarter(parseInt(value))}>
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {quarters.map((quarter) => (
                      <SelectItem key={quarter.value} value={quarter.value.toString()}>
                        {quarter.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Calendar Grid */}
          <Card className="overflow-auto flex-1">
            <CardContent>
              {leaveRecords.length === 0 ? (
                <div className="flex items-center justify-center min-h-[400px]">
                  <div className="text-center">
                    <CalendarIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No leave records</h3>
                    <p className="text-gray-500">This employee has no leave or WFH records yet.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 overflow-hidden h-full">
                  {/* Monthly View */}
                  {viewType === 'monthly' && (
                    <div className="space-y-2">
                      {/* Calendar Header */}
                      <div className="grid grid-cols-7 gap-1 mb-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                          <div key={day} className="p-1 text-center text-xs font-medium text-gray-500">
                            {day}
                          </div>
                        ))}
                      </div>

                      {/* Calendar Days - Responsive Grid */}
                      <div className="grid grid-cols-7 gap-1">
                        {generateCalendarDays().map((day, index) => {
                          if (day === null) {
                            return (
                              <div
                                key={index}
                                className="min-h-[60px] flex items-center justify-center"
                              ></div>
                            );
                          }

                          const IconComponent = day.icon;
                          return (
                            <div
                              key={index}
                              className={`
                                relative p-1.5 border rounded-md min-h-[60px] flex flex-col items-center justify-center transition-all duration-200 hover:shadow-md hover:scale-105 cursor-pointer
                                ${day.bgColor} ${day.borderColor}
                              `}
                            >
                              <div className="text-xs font-semibold mb-0.5">
                                {format(day.date, 'd')}
                              </div>
                              <IconComponent className={`w-3 h-3 mb-0.5 ${day.color}`} />
                              <div className="text-[10px] text-center opacity-75 leading-tight">
                                {day.type === 'weekend' ? 'Weekend' :
                                 day.type === 'leave' ? 'Leave' :
                                 day.type === 'wfh' ? 'WFH' :
                                 day.type === 'present' ? 'Present' : 'Work'}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Quarterly View */}
                  {viewType === 'quarterly' && (
                    <div className="space-y-6">
                      {generateQuarterCalendar().map((month, monthIndex) => (
                        <div key={monthIndex} className="border rounded-lg p-4">
                          <h3 className="text-lg font-semibold mb-3 text-center">{month.monthName}</h3>
                          
                          {/* Month Calendar Header */}
                          <div className="grid grid-cols-7 gap-1 mb-2">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                              <div key={day} className="p-1 text-center text-xs font-medium text-gray-500">
                                {day}
                              </div>
                            ))}
                          </div>

                          {/* Month Calendar Days */}
                          <div className="grid grid-cols-7 gap-1">
                            {month.days.map((day, dayIndex) => {
                              if (day === null) {
                                return (
                                  <div
                                    key={dayIndex}
                                    className="min-h-[40px] flex items-center justify-center"
                                  ></div>
                                );
                              }

                              const IconComponent = day.icon;
                              return (
                                <div
                                  key={dayIndex}
                                  className={`
                                    relative p-1 border rounded min-h-[40px] flex flex-col items-center justify-center transition-all duration-200 hover:shadow-sm hover:scale-105 cursor-pointer
                                    ${day.bgColor} ${day.borderColor}
                                  `}
                                >
                                  <div className="text-xs font-semibold mb-0.5">
                                    {format(day.date, 'd')}
                                  </div>
                                  <IconComponent className={`w-2.5 h-2.5 ${day.color}`} />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Yearly View */}
                  {viewType === 'yearly' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {generateYearlyCalendar().map((month, monthIndex) => (
                        <div key={monthIndex} className="border rounded-lg p-3 bg-white">
                          <h4 className="text-sm font-semibold mb-3 text-center text-gray-800">{month.monthName}</h4>
                          
                          {/* Mini month grid - Fixed width and consistent spacing */}
                          <div className="w-full">
                            {/* Mini header - Fixed height and consistent spacing */}
                            <div className="grid grid-cols-7 gap-px mb-1">
                              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                                <div key={idx} className="text-[10px] text-center text-gray-500 font-medium h-4 flex items-center justify-center">
                                  {day}
                                </div>
                              ))}
                            </div>
                            
                            {/* Month days - Grid with consistent cell sizes */}
                            <div className="grid grid-cols-7 gap-px">
                              {month.days.map((day, dayIndex) => {
                                if (day === null) {
                                  return (
                                    <div key={dayIndex} className="aspect-square w-full min-h-[20px] flex items-center justify-center"></div>
                                  );
                                }
                                
                                return (
                                  <div
                                    key={dayIndex}
                                    className={`
                                      aspect-square w-full min-h-[20px] text-[9px] rounded-sm flex items-center justify-center cursor-pointer font-medium border
                                      ${day.bgColor || 'bg-white'} ${day.color || 'text-gray-700'} ${day.borderColor || 'border-gray-200'}
                                      hover:shadow-sm hover:scale-105 transition-all duration-150
                                    `}
                                    title={`${format(day.date, 'MMM d')}: ${
                                      day.type === 'weekend' ? 'Weekend' :
                                      day.type === 'leave' ? 'Leave' :
                                      day.type === 'wfh' ? 'WFH' :
                                      day.type === 'present' ? 'Present' : 'Work'
                                    }`}
                                  >
                                    {day.type === 'leave' ? 'L' :
                                     day.type === 'wfh' ? 'W' :
                                     day.type === 'present' ? '✓' :
                                     day.type === 'weekend' ? '·' : day.day}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage-leaves" className="mt-3 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Leave Records
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {leaveRecords.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No leave records</h3>
                    <p className="text-gray-500">This employee has no leave records yet.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Period</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Days</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Created On</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leaveRecords.map((record) => {
                        const leaveDays = Object.values(record.days).filter(day => day === 'leave').length;
                        const wfhDays = Object.values(record.days).filter(day => day === 'wfh').length;
                        const totalDays = leaveDays + wfhDays;

                        // Calculate actual period from leave days
                        const leaveDates = Object.keys(record.days).sort();
                        const actualStartDate = leaveDates.length > 0 ? leaveDates[0] : record.startDate;
                        const actualEndDate = leaveDates.length > 0 ? leaveDates[leaveDates.length - 1] : record.endDate;

                        return (
                          <TableRow key={record.id}>
                            <TableCell>
                              <div className="text-sm font-medium">
                                {format(new Date(actualStartDate), 'MMM d, yyyy')} - {format(new Date(actualEndDate), 'MMM d, yyyy')}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-2">
                                {leaveDays > 0 && (
                                  <Badge variant="destructive" className="text-xs">
                                    {leaveDays} Leave
                                  </Badge>
                                )}
                                {wfhDays > 0 && (
                                  <Badge variant="secondary" className="text-xs">
                                    {wfhDays} WFH
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm font-medium">{totalDays} days</div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={record.approved ? "default" : "outline"}>
                                {record.approved ? 'Approved' : 'Pending'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-gray-600 max-w-xs truncate">
                                {record.reason || 'No reason provided'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-gray-600">
                                {record.createdAt ? format(new Date(record.createdAt), 'MMM d, yyyy') : 'N/A'}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center gap-2 justify-end">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 w-8 p-0"
                                  onClick={() => openEditModal(record)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                  onClick={() => handleDeleteLeave(record.id!)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Edit Leave Modal */}
          <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle>Edit Leave Record</DialogTitle>
              </DialogHeader>
              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !editFormData.startDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {editFormData.startDate ? (
                            format(editFormData.startDate, "PPP")
                          ) : (
                            <span>Pick start date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={editFormData.startDate}
                          onSelect={(date) => setEditFormData(prev => ({ ...prev, startDate: date }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !editFormData.endDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {editFormData.endDate ? (
                            format(editFormData.endDate, "PPP")
                          ) : (
                            <span>Pick end date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={editFormData.endDate}
                          onSelect={(date) => setEditFormData(prev => ({ ...prev, endDate: date }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div>
                  <Label htmlFor="reason">Reason</Label>
                  <Textarea
                    id="reason"
                    value={editFormData.reason}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="Enter reason for leave..."
                  />
                </div>

                <div className="flex flex-col">
                  <Label>Days Configuration</Label>
                  <div className="mt-2 flex-1 min-h-0">
                    <div className="border rounded-lg p-4 max-h-80 overflow-y-auto">
                      {Object.keys(editFormData.days).length === 0 ? (
                        <p className="text-sm text-gray-500">No days configured yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {Object.entries(editFormData.days)
                            .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
                            .map(([date, dayType]) => (
                            <div key={date} className="flex items-center gap-4 p-3 border rounded-lg">
                              <div className="text-sm font-medium">
                                {format(new Date(date), 'MMM d, yyyy')}
                              </div>
                              <Select
                                value={dayType}
                                onValueChange={(value: 'leave' | 'wfh' | 'present') => handleDateChange(date, value)}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="leave">
                                    <div className="flex items-center gap-2">
                                      <XCircle className="h-4 w-4 text-red-500" />
                                      Leave
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="wfh">
                                    <div className="flex items-center gap-2">
                                      <Home className="h-4 w-4 text-blue-500" />
                                      WFH
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const newDays = { ...editFormData.days };
                                  delete newDays[date];
                                  setEditFormData(prev => ({ ...prev, days: newDays }));
                                }}
                              >
                                Remove
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleEditSubmit}>
                  Save Changes
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
};
