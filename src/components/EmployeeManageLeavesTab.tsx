import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  FileText,
  Edit,
  Trash2,
  CalendarIcon,
  XCircle,
  Home
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { LeaveRecord } from '@/lib/types';

interface EmployeeManageLeavesTabProps {
  leaveRecords: LeaveRecord[];
  onEditRecord: (record: LeaveRecord, updatedData: Partial<LeaveRecord>) => Promise<void>;
  onDeleteRecord: (recordId: string) => Promise<void>;
}

export const EmployeeManageLeavesTab: React.FC<EmployeeManageLeavesTabProps> = ({
  leaveRecords,
  onEditRecord,
  onDeleteRecord
}) => {
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
      await onEditRecord(editingRecord, {
        startDate: format(editFormData.startDate, 'yyyy-MM-dd'),
        endDate: format(editFormData.endDate, 'yyyy-MM-dd'),
        reason: editFormData.reason,
        days: editFormData.days
      });

      setIsEditModalOpen(false);
      setEditingRecord(null);
    } catch (error) {
      console.error('Error updating leave record:', error);
      // Error handling can be passed up to parent component
      throw error;
    }
  };

  const handleDeleteLeave = (recordId: string) => {
    setDeleteRecordId(recordId);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteLeave = async () => {
    if (!deleteRecordId) return;

    try {
      await onDeleteRecord(deleteRecordId);
      setIsDeleteModalOpen(false);
      setDeleteRecordId(null);
    } catch (error) {
      console.error('Error deleting leave record:', error);
      throw error;
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

  return (
    <div className="space-y-6">
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
                      showOutsideDays={false}
                      fromMonth={new Date()}
                      disabled={(date) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return date < today;
                      }}
                      modifiers={{
                        past: (date) => {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          return date < today;
                        }
                      }}
                      modifiersClassNames={{
                        past: "text-gray-400 font-normal",
                      }}
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
                      showOutsideDays={false}
                      fromMonth={new Date()}
                      disabled={(date) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return date < today;
                      }}
                      modifiers={{
                        past: (date) => {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          return date < today;
                        }
                      }}
                      modifiersClassNames={{
                        past: "text-gray-400 font-normal",
                      }}
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
    </div>
  );
};
