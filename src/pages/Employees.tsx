import React, { useState } from 'react';
import { EmployeeList } from '@/components/EmployeeList';
import { EmployeeForm } from '@/components/EmployeeForm';
import type { Employee } from '@/lib/types';

export const Employees: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleCreateEmployee = () => {
    setEditingEmployee(null);
    setShowForm(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingEmployee(null);
  };

  const handleFormSuccess = () => {
    setRefreshTrigger(prev => prev + 1); // Trigger refresh of employee list
  };

  return (
    <div className="space-y-6 flex flex-col h-full overflow-hidden">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Employees</h1>
        <p className="mt-2 text-gray-600">Manage employee information and records</p>
      </div>

      <EmployeeList
        onEditEmployee={handleEditEmployee}
        onCreateEmployee={handleCreateEmployee}
        refreshTrigger={refreshTrigger}
      />

      <EmployeeForm
        open={showForm}
        onClose={handleFormClose}
        employee={editingEmployee}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
};
