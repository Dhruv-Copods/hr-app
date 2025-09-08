import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  User,
  Mail,
  MapPin,
  Briefcase,
  Building,
  CalendarIcon
} from 'lucide-react';
import { formatDateLong } from '@/lib/helpers';
import type { Employee } from '@/lib/types';

interface EmployeeOverviewTabProps {
  employee: Employee;
  stats: {
    totalLeaveDays: number;
    totalWfhDays: number;
    totalRecords: number;
  };
}

export const EmployeeOverviewTab: React.FC<EmployeeOverviewTabProps> = ({
  employee,
  stats
}) => {
  return (
    <div className="space-y-6">
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
                <p>{formatDateLong(employee.dateOfJoining)}</p>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-500">Date of Birth</Label>
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-gray-400" />
                <p>{formatDateLong(employee.dateOfBirth)}</p>
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
    </div>
  );
};
