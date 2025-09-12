import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  User,
  Briefcase
} from 'lucide-react';
import { formatDateLong } from '@/lib/helpers';
import type { Employee } from '@/lib/types';

interface EmployeeOverviewTabProps {
  employee: Employee;
}

export const EmployeeOverviewTab: React.FC<EmployeeOverviewTabProps> = ({
  employee
}) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Name</Label>
                  <p>{employee.name}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-500">Official Email</Label>
                  <p>{employee.officialEmail}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Date of Birth</Label>
                  <p>{formatDateLong(employee.dateOfBirth)}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-500">Personal Email</Label>
                  <p>{employee.personalEmail}</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Current Address</Label>
                  <p className="whitespace-pre-wrap">{employee.currentAddress}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Permanent Address</Label>
                  <p className="whitespace-pre-wrap">{employee.permanentAddress}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Employee Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Employee Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Department</Label>
                  <p>{employee.department}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Designation</Label>
                  <p>{employee.designation}</p>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <Label className="text-sm font-medium text-gray-500">Date of Joining</Label>
              <p>{formatDateLong(employee.dateOfJoining)}</p>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};
