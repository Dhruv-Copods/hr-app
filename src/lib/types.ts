export interface Employee {
  id?: string;
  employeeId: string; // Auto-generated unique employee ID
  name: string;
  department: string;
  designation: string;
  dateOfJoining: string;
  dateOfBirth: string;
  currentAddress: string;
  permanentAddress: string;
  officialEmail: string;
  personalEmail: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateEmployeeData extends Omit<Employee, 'id' | 'createdAt' | 'updatedAt' | 'employeeId'> {}
export interface UpdateEmployeeData extends Partial<CreateEmployeeData> {}

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

export const DESIGNATIONS = [
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
export type Designation = typeof DESIGNATIONS[number];

// Leave Management Types
export type LeaveDayType = 'leave' | 'wfh' | 'present';

export interface LeaveRecord {
  id?: string;
  employeeId: string; // References Employee.employeeId field
  startDate: string;
  endDate: string;
  days: {
    [date: string]: LeaveDayType; // Date in YYYY-MM-DD format
  };
  reason?: string;
  approved?: boolean; // Optional since we're not using approval workflow
  approvedBy?: string;
  approvedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateLeaveRecordData extends Omit<LeaveRecord, 'id' | 'createdAt' | 'updatedAt' | 'approved' | 'approvedBy' | 'approvedAt'> {}

export interface UpdateLeaveRecordData extends Partial<Omit<LeaveRecord, 'id' | 'createdAt'>> {}

// Holiday Types
export type HolidayType = 'government' | 'optional';

export interface Holiday {
  id: string;
  date: string; // YYYY-MM-DD format
  name: string;
  type: HolidayType;
  description?: string;
}

export interface CreateHolidayData extends Omit<Holiday, 'id'> {}

// Settings Types
export interface CompanySettings {
  ptoYearly: number;
  ptoMonthly: number;
  wfhYearly: number;
  wfhMonthly: number;
  holidays: Holiday[];
  updatedAt?: string;
  updatedBy?: string;
}
