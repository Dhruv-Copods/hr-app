import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Mail,
  MapPin,
  Calendar,
  User,
  Building,
  Briefcase,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { EmployeeService } from '@/lib/employeeService';
import { LeaveService } from '@/lib/leaveService';
import type { Employee, LeaveRecord, LeaveDayType } from '@/lib/types';
import { format } from 'date-fns';

export const EmployeeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [leaveRecords, setLeaveRecords] = useState<LeaveRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      setError(null);

      const [employeeData, leaveData] = await Promise.all([
        EmployeeService.getEmployeeById(id),
        LeaveService.getLeaveRecordsByEmployee(id)
      ]);

      if (!employeeData) {
        setError('Employee not found');
        return;
      }

      setEmployee(employeeData);
      setLeaveRecords(leaveData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch employee data');
    } finally {
      setLoading(false);
    }
  };



  const getLeaveDayTypeIcon = (type: LeaveDayType) => {
    switch (type) {
      case 'leave':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'wfh':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'present':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };



  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const calculateLeaveStats = () => {
    const currentYear = new Date().getFullYear();
    const currentYearRecords = leaveRecords.filter(record => {
      const recordYear = new Date(record.startDate).getFullYear();
      return recordYear === currentYear;
    });

    let totalLeaveDays = 0;
    let totalWfhDays = 0;

    currentYearRecords.forEach(record => {
      Object.values(record.days).forEach(dayType => {
        if (dayType === 'leave') totalLeaveDays++;
        if (dayType === 'wfh') totalWfhDays++;
      });
    });

    return { totalLeaveDays, totalWfhDays, totalRecords: currentYearRecords.length };
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

  if (error || !employee) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {error || 'Employee not found'}
            </h3>
            <Button onClick={() => navigate('/employees')} className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Employees
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = calculateLeaveStats();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-4 flex-shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/employees')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Employees
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {employee.name}
          </h1>
          <p className="text-gray-600">Employee Details</p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="flex-1 flex flex-col mt-6 h-full overflow-hidden">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="leave-history">Leave History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="flex-1 overflow-y-auto space-y-6">
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
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <p>{formatDate(employee.dateOfJoining)}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-500">Date of Birth</Label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <p>{formatDate(employee.dateOfBirth)}</p>
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
        </TabsContent>

        <TabsContent value="leave-history" className="flex-1 flex flex-col h-full overflow-hidden">
          <Card className="flex-1 flex flex-col min-h-0">
            <CardHeader className="flex-shrink-0">
              <CardTitle>Leave History</CardTitle>
              <CardDescription>
                Complete history of leave requests and work-from-home records
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              {leaveRecords.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No leave records</h3>
                  <p className="text-gray-500">This employee has no leave or WFH records yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {leaveRecords.map((record) => (
                    <div key={record.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium">
                              {format(new Date(record.startDate), 'MMM dd, yyyy')} - {format(new Date(record.endDate), 'MMM dd, yyyy')}
                            </h3>
                            <Badge variant={record.approved ? 'default' : 'secondary'}>
                              {record.approved ? 'Approved' : 'Pending'}
                            </Badge>
                          </div>
                          {record.reason && (
                            <p className="text-sm text-gray-600 mb-2">{record.reason}</p>
                          )}
                          <p className="text-xs text-gray-500">
                            Created: {formatDate(record.createdAt!)}
                            {record.approvedAt && ` • Approved: ${formatDate(record.approvedAt)}`}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {Object.entries(record.days).map(([date, type]) => (
                          <div key={date} className="flex items-center gap-2 text-sm">
                            {getLeaveDayTypeIcon(type)}
                            <span>{format(new Date(date), 'EEE, MMM dd')}</span>
                            <Badge variant="outline" className="text-xs">
                              {type.toUpperCase()}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
