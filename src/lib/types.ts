export interface Employee {
  id?: string;
  employeeId: string; // Auto-generated unique employee ID
  name: string;
  employeeType: 'employee' | 'consultant';
  department: string;
  designation: string;
  dateOfJoining: string;
  dateOfBirth: string;
  currentAddress: string;
  permanentAddress: string;
  officialEmail: string;
  personalEmail: string;
  mobileNumber?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateEmployeeData = Omit<Employee, 'id' | 'createdAt' | 'updatedAt' | 'employeeId'>;
export type UpdateEmployeeData = Partial<CreateEmployeeData>;

export const DEPARTMENTS = [
  'Engineering',
  'Design',
  'Sales',
  'Marketing',
  'Human Resources'
] as const;

export const DESIGNATIONS = [
  // Engineering
  'Web Developer',
  'Mobile Developer',
  "QA Engineer",
  // Design
  'Graphic Designer',
  'UX Designer',
  'Visual Designer',
  'Product Designer',
  // Sales
  'Business Development Representative',
  // Marketing
  'Marketing Strategist',
  'Digital Marketing Executive',
  // Human Resources
  'HR Manager'
] as const;

export type Department = typeof DEPARTMENTS[number];
export type Designation = typeof DESIGNATIONS[number];

// Department to designations mapping
export const DEPARTMENT_DESIGNATIONS = {
  Engineering: ['Web Developer', 'Mobile Developer', 'QA Engineer'],
  Design: ['Graphic Designer', 'UX Designer', 'Visual Designer', 'Product Designer'],
  Sales: ['Business Development Representative'],
  Marketing: ['Marketing Strategist', 'Digital Marketing Executive'],
  'Human Resources': ['HR Manager']
} as const;

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

export type CreateLeaveRecordData = Omit<LeaveRecord, 'id' | 'createdAt' | 'updatedAt' | 'approved' | 'approvedBy' | 'approvedAt'>;

export type UpdateLeaveRecordData = Partial<Omit<LeaveRecord, 'id' | 'createdAt'>>;

// Holiday Types
export type HolidayType = 'holiday' | 'optional';

export interface Holiday {
  id: string;
  date: string; // YYYY-MM-DD format
  name: string;
  type: HolidayType;
  description?: string;
}

export type CreateHolidayData = Omit<Holiday, 'id'>;

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
