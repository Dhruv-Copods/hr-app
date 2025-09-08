import { createContext, useContext } from 'react';
import type { Employee, CreateEmployeeData, UpdateEmployeeData } from '@/lib/types';

export interface EmployeeContextType {
  employees: Employee[];
  loading: boolean;
  error: string | null;
  fetchEmployees: () => Promise<void>;
  createEmployee: (data: CreateEmployeeData) => Promise<Employee>;
  updateEmployee: (id: string, data: UpdateEmployeeData) => Promise<Employee>;
  deleteEmployee: (id: string) => Promise<void>;
  getEmployeeById: (id: string) => Employee | undefined;
  refreshEmployees: () => Promise<void>;
}

export const EmployeeContext = createContext<EmployeeContextType | undefined>(undefined);

export const useEmployee = () => {
  const context = useContext(EmployeeContext);
  if (context === undefined) {
    throw new Error('useEmployee must be used within an EmployeeProvider');
  }
  return context;
};
