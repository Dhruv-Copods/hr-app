export interface Employee {
  id?: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  hireDate: string;
  salary: number;
  status: 'active' | 'inactive' | 'terminated';
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateEmployeeData extends Omit<Employee, 'id' | 'createdAt' | 'updatedAt'> {}
export interface UpdateEmployeeData extends Partial<CreateEmployeeData> {}

export type EmployeeStatus = Employee['status'];

export const DEPARTMENTS = [
  'Engineering',
  'Human Resources',
  'Finance',
  'Marketing',
  'Sales',
  'Operations',
  'Customer Support',
  'Legal',
  'Administration'
] as const;

export const POSITIONS = [
  'Software Engineer',
  'Senior Software Engineer',
  'Team Lead',
  'Engineering Manager',
  'Director of Engineering',
  'HR Manager',
  'HR Specialist',
  'Financial Analyst',
  'Accountant',
  'Marketing Manager',
  'Marketing Specialist',
  'Sales Representative',
  'Sales Manager',
  'Operations Manager',
  'Customer Support Specialist',
  'Legal Counsel',
  'Office Manager',
  'Executive Assistant'
] as const;

export type Department = typeof DEPARTMENTS[number];
export type Position = typeof POSITIONS[number];

// Leave Management Types
export type LeaveDayType = 'leave' | 'wfh' | 'present';

export interface LeaveRecord {
  id?: string;
  employeeId: string;
  startDate: string;
  endDate: string;
  days: {
    [date: string]: LeaveDayType; // Date in YYYY-MM-DD format
  };
  reason?: string;
  approved: boolean;
  approvedBy?: string;
  approvedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateLeaveRecordData extends Omit<LeaveRecord, 'id' | 'createdAt' | 'updatedAt' | 'approved' | 'approvedBy' | 'approvedAt'> {
  approved?: boolean;
}

export interface UpdateLeaveRecordData extends Partial<Omit<LeaveRecord, 'id' | 'createdAt'>> {}
