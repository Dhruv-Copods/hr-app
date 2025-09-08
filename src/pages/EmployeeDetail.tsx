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
  XCircle,
  Home,
  Edit,
  Trash2,
  FileText
} from 'lucide-react';
import { getLeaveRecordsByEmployee, updateLeaveRecord, deleteLeaveRecord } from '@/lib/leaveService';
import { getEmployeeById } from '@/lib/employeeService';
import type { Employee, LeaveRecord } from '@/lib/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export const EmployeeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [leaveRecords, setLeaveRecords] = useState<LeaveRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRecord, setEditingRecord] = useState<LeaveRecord | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteRecordId, setDeleteRecordId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
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

      const employeeData = await getEmployeeById(id);

      if (!employeeData) {
        toast.error('Employee not found');
        navigate('/employees');
        return;
      }

      // Fetch leave records using the employee's employeeId
      const leaveData = await getLeaveRecordsByEmployee(employeeData.employeeId);

      setEmployee(employeeData);
      setLeaveRecords(leaveData);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to fetch employee data');
      navigate('/employees');
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
      await updateLeaveRecord(editingRecord.id!, {
        startDate: format(editFormData.startDate, 'yyyy-MM-dd'),
        endDate: format(editFormData.endDate, 'yyyy-MM-dd'),
        reason: editFormData.reason,
        days: editFormData.days
      });

      // Refresh leave records
      if (employee) {
        const updatedRecords = await getLeaveRecordsByEmployee(employee.employeeId);
        setLeaveRecords(updatedRecords);
      }

      setIsEditModalOpen(false);
      setEditingRecord(null);
      toast.success('Leave record updated successfully');
    } catch (error) {
      console.error('Error updating leave record:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update leave record');
    }
  };

  const handleDeleteLeave = (recordId: string) => {
    setDeleteRecordId(recordId);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteLeave = async () => {
    if (!deleteRecordId) return;

    try {
      await deleteLeaveRecord(deleteRecordId);

      // Refresh leave records
      if (employee) {
        const updatedRecords = await getLeaveRecordsByEmployee(employee.employeeId);
        setLeaveRecords(updatedRecords);
      }
      toast.success('Leave record deleted successfully');
    } catch (error) {
      console.error('Error deleting leave record:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete leave record');
    } finally {
      setIsDeleteModalOpen(false);
      setDeleteRecordId(null);
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

  if (!employee) {
    return null; // Will redirect due to error handling in useEffect
  }

  const stats = calculateLeaveStats();

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

      <Tabs defaultValue="overview" className="pt-6 overflow-hidden h-full flex flex-col">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="manage-leaves">Manage Leaves</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-3 space-y-6 overflow-y-auto flex-1">
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

        <TabsContent value="manage-leaves" className="mt-3 space-y-6 overflow-y-auto flex-1">
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
                        <TableHead>Reason</TableHead>
                        <TableHead>Created On</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leaveRecords.map((record) => {
                        // Calculate leave and WFH days excluding weekends
                        const leaveDays = Object.entries(record.days)
                          .filter(([dateKey, dayType]) => {
                            const date = new Date(dateKey);
                            return dayType === 'leave' && date.getDay() !== 0 && date.getDay() !== 6; // Exclude weekends
                          }).length;

                        const wfhDays = Object.entries(record.days)
                          .filter(([dateKey, dayType]) => {
                            const date = new Date(dateKey);
                            return dayType === 'wfh' && date.getDay() !== 0 && date.getDay() !== 6; // Exclude weekends
                          }).length;

                        const totalDays = leaveDays + wfhDays;

                        // Calculate actual period from leave days
                        const leaveDates = Object.keys(record.days).sort();
                        const actualStartDate = leaveDates.length > 0 ? leaveDates[0] : record.startDate;
                        const actualEndDate = leaveDates.length > 0 ? leaveDates[leaveDates.length - 1] : record.endDate;

                        // Calculate number of weekends in the period
                        const startDate = new Date(actualStartDate);
                        const endDate = new Date(actualEndDate);
                        let weekendCount = 0;
                        const current = new Date(startDate);
                        while (current <= endDate) {
                          if (current.getDay() === 0 || current.getDay() === 6) { // 0 = Sunday, 6 = Saturday
                            weekendCount++;
                          }
                          current.setDate(current.getDate() + 1);
                        }

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
                                {weekendCount > 0 && (
                                  <Badge className="bg-orange-100 text-orange-800 border-orange-200 text-xs">
                                    {weekendCount} Weekend{weekendCount > 1 ? 's' : ''}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm font-medium">{totalDays} days</div>
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

          {/* Delete Confirmation Modal */}
          <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Delete Leave Record</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <p className="text-gray-600">
                  Are you sure you want to delete this leave record? This action cannot be undone.
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={confirmDeleteLeave}>
                  Delete
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Edit Leave Modal */}
          <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle>Edit Leave Record</DialogTitle>
              </DialogHeader>
              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-2">Start Date</Label>
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
                    <Label className="mb-2">End Date</Label>
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
                  <Label htmlFor="reason" className="mb-2">Reason</Label>
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
                            .map(([date, dayType]) => {
                            const dateObj = new Date(date);
                            const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6; // 0 = Sunday, 6 = Saturday

                            return (
                            <div key={date} className={`flex items-center gap-4 p-3 border rounded-lg ${
                              isWeekend ? 'bg-orange-50 border-orange-200' : ''
                            }`}>
                              <div className={`text-sm font-medium ${
                                isWeekend ? 'text-orange-800' : ''
                              }`}>
                                {format(new Date(date), 'MMM d, yyyy')}
                                {isWeekend && (
                                  <Badge className="ml-2 bg-orange-100 text-orange-800 border-orange-200 text-xs">
                                    Weekend
                                  </Badge>
                                )}
                              </div>
                              {!isWeekend && (
                                <Select
                                  value={dayType}
                                  onValueChange={(value: 'leave' | 'wfh' | 'present') => handleDateChange(date, value)}
                                  disabled={isWeekend}
                                >
                                  <SelectTrigger className={`w-32 ${isWeekend ? 'opacity-50' : ''}`}>
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
                              )}
                              {
                                !isWeekend && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="ml-auto"
                                    onClick={() => {
                                      const newDays = { ...editFormData.days };
                                      delete newDays[date];
                                      setEditFormData(prev => ({ ...prev, days: newDays }));
                                    }}
                                    disabled={isWeekend}
                                  >
                                    Remove
                                  </Button>
                                )
                              }
                            </div>
                            );
                          })}
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
