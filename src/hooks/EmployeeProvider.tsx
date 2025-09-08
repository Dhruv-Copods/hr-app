import React, { useEffect, useState, useCallback } from 'react';
import { getAllEmployees, createEmployee as createEmployeeService, updateEmployee as updateEmployeeService, deleteEmployee as deleteEmployeeService } from '@/lib/employeeService';
import { EmployeeContext } from '@/hooks/EmployeeContext';
import type { Employee, CreateEmployeeData, UpdateEmployeeData } from '@/lib/types';
import { toast } from 'sonner';

interface EmployeeProviderProps {
  children: React.ReactNode;
}

export const EmployeeProvider: React.FC<EmployeeProviderProps> = ({ children }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllEmployees();
      setEmployees(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch employees';
      setError(errorMessage);
      console.error('Error fetching employees:', err);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const createEmployee = useCallback(async (data: CreateEmployeeData): Promise<Employee> => {
    try {
      const newEmployee = await createEmployeeService(data);
      setEmployees(prev => [newEmployee, ...prev]);
      toast.success('Employee created successfully');
      return newEmployee;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create employee';
      console.error('Error creating employee:', err);
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  const updateEmployee = useCallback(async (id: string, data: UpdateEmployeeData): Promise<Employee> => {
    try {
      const updatedEmployee = await updateEmployeeService(id, data);
      setEmployees(prev => prev.map(emp => emp.id === id ? updatedEmployee : emp));
      toast.success('Employee updated successfully');
      return updatedEmployee;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update employee';
      console.error('Error updating employee:', err);
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  const deleteEmployee = useCallback(async (id: string): Promise<void> => {
    try {
      await deleteEmployeeService(id);
      setEmployees(prev => prev.filter(emp => emp.id !== id));
      toast.success('Employee deleted successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete employee';
      console.error('Error deleting employee:', err);
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  const getEmployeeById = useCallback((id: string): Employee | undefined => {
    return employees.find(emp => emp.id === id);
  }, [employees]);

  const refreshEmployees = useCallback(async (): Promise<void> => {
    await fetchEmployees();
  }, [fetchEmployees]);

  // Initial data fetch
  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const value = {
    employees,
    loading,
    error,
    fetchEmployees,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    getEmployeeById,
    refreshEmployees,
  };

  return (
    <EmployeeContext.Provider value={value}>
      {children}
    </EmployeeContext.Provider>
  );
};
