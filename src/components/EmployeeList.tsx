import React, { useState, useEffect } from 'react';
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmployeeService } from '@/lib/employeeService';
import type { Employee } from '@/lib/types';
import { MoreHorizontal, Edit, Trash2, UserPlus } from 'lucide-react';

interface EmployeeListProps {
  onEditEmployee: (employee: Employee) => void;
  onCreateEmployee: () => void;
  refreshTrigger?: number;
}

export const EmployeeList: React.FC<EmployeeListProps> = ({
  onEditEmployee,
  onCreateEmployee,
  refreshTrigger
}) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Table column configuration
  const tableColumns = [
    {
      key: 'employeeId',
      label: 'Employee ID',
      render: (employee: Employee) => (
        <span className="font-medium text-gray-900">{employee.employeeId}</span>
      )
    },
    {
      key: 'name',
      label: 'Name',
      render: (employee: Employee) => (
        <span className="text-gray-700">{`${employee.firstName} ${employee.lastName}`}</span>
      )
    },
    {
      key: 'email',
      label: 'Email',
      render: (employee: Employee) => (
        <span className="text-gray-600">{employee.email}</span>
      )
    },
    {
      key: 'department',
      label: 'Department',
      render: (employee: Employee) => (
        <span className="text-gray-700">{employee.department}</span>
      )
    },
    {
      key: 'position',
      label: 'Position',
      render: (employee: Employee) => (
        <span className="text-gray-700">{employee.position}</span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (employee: Employee) => (
        <Badge variant={getStatusBadgeVariant(employee.status)} className="font-medium">
          {employee.status.charAt(0).toUpperCase() + employee.status.slice(1)}
        </Badge>
      )
    },
    {
      key: 'hireDate',
      label: 'Hire Date',
      render: (employee: Employee) => (
        <span className="text-gray-600">{formatDate(employee.hireDate)}</span>
      )
    },
    {
      key: 'salary',
      label: 'Salary',
      render: (employee: Employee) => (
        <span className="text-gray-700 font-medium">{formatCurrency(employee.salary)}</span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      width: 'w-[70px]',
      render: (employee: Employee) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-100">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={() => onEditEmployee(employee)} className="cursor-pointer">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => employee.id && handleDeleteEmployee(employee.id)}
              className="text-red-600 cursor-pointer focus:text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ];

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await EmployeeService.getAllEmployees();
      setEmployees(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [refreshTrigger]);

  const handleDeleteEmployee = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this employee? This action cannot be undone.')) {
      return;
    }

    try {
      await EmployeeService.deleteEmployee(id);
      await fetchEmployees(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete employee');
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'inactive':
        return 'secondary';
      case 'terminated':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading employees...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchEmployees} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='shadow-none overflow-hidden' >
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Employees</CardTitle>
          <CardDescription>
            Manage your employee database ({employees.length} employees)
          </CardDescription>
        </div>
        <Button onClick={onCreateEmployee} className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Add Employee
        </Button>
      </CardHeader>
      <CardContent className="w-full overflow-hidden">
        {employees.length === 0 ? (
          <div className="text-center py-12">
            <UserPlus className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No employees yet</h3>
            <p className="text-gray-500 mb-4">Get started by adding your first employee.</p>
          </div>
        ) : (
          <div className="rounded-lg border shadow-none overflow-hidden w-full h-full">
            <div className="overflow-y-auto h-full">
              <table className="w-full caption-bottom text-sm relative" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
                <TableHeader className="bg-white sticky top-0 z-10">
                  <TableRow>
                    {tableColumns.map((column) => (
                      <TableHead 
                        key={column.key}
                        className={`h-12 px-6 font-semibold text-gray-900 bg-white border-b-1 border-gray-200 ${column.width || ''}`}
                      >
                        {column.label}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((employee, index) => (
                    <TableRow
                      key={employee.id}
                      className={`
                        hover:bg-gray-50/50 transition-colors
                        ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/20'}
                      `}
                    >
                      {tableColumns.map((column) => (
                        <TableCell 
                          key={column.key}
                          className="px-6 py-4 border-b border-gray-200"
                        >
                          {column.render(employee)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
