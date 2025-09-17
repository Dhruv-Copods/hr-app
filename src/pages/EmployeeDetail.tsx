import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Edit } from 'lucide-react';
import { getEmployeeById } from '@/lib/employeeService';
import type { Employee, LeaveRecord } from '@/lib/types';
import { toast } from 'sonner';
import { useLeave } from '@/hooks/LeaveContext';
import { EmployeeOverviewTab } from '@/components/EmployeeOverviewTab';
import { EmployeeManageLeavesTab } from '@/components/EmployeeManageLeavesTab';
import { EmployeeForm } from '@/components/EmployeeForm';

export const EmployeeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { updateLeaveRecord, deleteLeaveRecord, getEmployeeLeaveRecords } = useLeave();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

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

      setEmployee(employeeData);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to fetch employee data');
      navigate('/employees');
    } finally {
      setLoading(false);
    }
  };

  const handleEditRecord = async (record: LeaveRecord, updatedData: Partial<LeaveRecord>) => {
    try {
      await updateLeaveRecord(record.id!, updatedData);
      toast.success('Leave record updated successfully');
    } catch (error) {
      console.error('Error updating leave record:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update leave record');
      throw error; // Re-throw to let the tab component handle it
    }
  };

  const handleDeleteRecord = async (recordId: string) => {
    try {
      await deleteLeaveRecord(recordId);
    } catch (error) {
      console.error('Error deleting leave record:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete leave record');
      throw error; // Re-throw to let the tab component handle it
    }
  };

  const handleEditEmployee = () => {
    setEditDialogOpen(true);
  };

  const handleEditDialogClose = () => {
    setEditDialogOpen(false);
    // Refetch employee data after editing to ensure we have the latest data
    if (id) {
      fetchEmployeeData();
    }
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
              <Badge variant="outline" className="text-xs">
                {employee.employeeType === 'employee' ? 'Employee' : 'Consultant'}
              </Badge>
            </div>
            <p className="text-sm text-gray-600 mt-1">{employee.department} - {employee.designation}</p>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleEditEmployee}
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/employees')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="pt-6 overflow-hidden h-full flex flex-col">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="manage-leaves">Manage Leaves</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-3 overflow-y-auto flex-1">
          <EmployeeOverviewTab employee={employee} />
        </TabsContent>

        <TabsContent value="manage-leaves" className="mt-3 overflow-y-auto flex-1">
          <EmployeeManageLeavesTab
            leaveRecords={employee ? getEmployeeLeaveRecords(employee.employeeId) : []}
            onEditRecord={handleEditRecord}
            onDeleteRecord={handleDeleteRecord}
          />
        </TabsContent>
      </Tabs>

      {/* Edit Employee Dialog */}
      <EmployeeForm
        open={editDialogOpen}
        onClose={handleEditDialogClose}
        employee={employee}
      />
    </div>
  );
};
