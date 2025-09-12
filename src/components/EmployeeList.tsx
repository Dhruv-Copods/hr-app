import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Employee } from '@/lib/types';
import { Edit, Trash2, UserPlus, Search, ChevronUp, ChevronDown } from 'lucide-react';
import { useEmployee } from '@/hooks/EmployeeContext';

interface EmployeeListProps {
  onEditEmployee: (employee: Employee) => void;
  onCreateEmployee: () => void;
}

export const EmployeeList: React.FC<EmployeeListProps> = ({
  onEditEmployee,
  onCreateEmployee,
}) => {
  const navigate = useNavigate();
  const { employees, loading, error, deleteEmployee, refreshEmployees } = useEmployee();
  const [deleteEmployeeId, setDeleteEmployeeId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Search and sorting state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'department' | 'designation'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Filtered and sorted employees
  const filteredAndSortedEmployees = useMemo(() => {
    const filtered = employees.filter((employee) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        employee.name.toLowerCase().includes(searchLower) ||
        employee.department.toLowerCase().includes(searchLower) ||
        employee.designation.toLowerCase().includes(searchLower)
      );
    });

    // Sort the filtered employees
    filtered.sort((a, b) => {
      const aValue = a[sortBy].toLowerCase();
      const bValue = b[sortBy].toLowerCase();

      if (sortOrder === 'asc') {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });

    return filtered;
  }, [employees, searchQuery, sortBy, sortOrder]);

  // Handle sorting
  const handleSort = (column: 'name' | 'department' | 'designation') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  // Table column configuration - simplified to show only essential data
  const tableColumns = [
    {
      key: 'name' as const,
      label: 'Name',
      sortable: true,
      render: (employee: Employee) => (
        <span className="text-gray-700 font-medium">{employee.name}</span>
      )
    },
    {
      key: 'department' as const,
      label: 'Department',
      sortable: true,
      render: (employee: Employee) => (
        <span className="text-gray-700">{employee.department}</span>
      )
    },
    {
      key: 'designation' as const,
      label: 'Designation',
      sortable: true,
      render: (employee: Employee) => (
        <span className="text-gray-700">{employee.designation}</span>
      )
    },
    {
      key: 'actions' as const,
      label: 'Actions',
      sortable: false,
      width: 'w-[80px]',
      render: (employee: Employee) => (
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEditEmployee(employee)}
            className="h-8 w-8 p-0"
            title="Edit employee"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => employee.id && handleDeleteEmployee(employee.id)}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
            title="Delete employee"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  const handleDeleteEmployee = (id: string) => {
    setDeleteEmployeeId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteEmployee = async () => {
    if (!deleteEmployeeId) return;

    try {
      await deleteEmployee(deleteEmployeeId);
      setIsDeleteModalOpen(false);
      setDeleteEmployeeId(null);
    } catch {
      // Error handling is done in the context
      setIsDeleteModalOpen(false);
      setDeleteEmployeeId(null);
    }
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
            <Button onClick={refreshEmployees} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className='shadow-none overflow-hidden' >
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Employees</CardTitle>
            <CardDescription>
              Manage your employee database ({filteredAndSortedEmployees.length} {filteredAndSortedEmployees.length === 1 ? 'employee' : 'employees'}{employees.length !== filteredAndSortedEmployees.length && ` of ${employees.length} total`})
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search employees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Button onClick={onCreateEmployee} className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Add Employee
            </Button>
          </div>
        </CardHeader>
        <CardContent className="w-full overflow-hidden">
          {employees.length === 0 ? (
            <div className="text-center py-12">
              <UserPlus className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No employees yet</h3>
              <p className="text-gray-500 mb-4">Get started by adding your first employee.</p>
            </div>
          ) : filteredAndSortedEmployees.length === 0 && !searchQuery ? (
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
                          className={`h-12 px-6 font-semibold text-gray-900 bg-white border-b-1 border-gray-200 ${column.width || ''} ${column.sortable ? 'cursor-pointer hover:bg-gray-50 select-none' : ''}`}
                          onClick={column.sortable ? () => handleSort(column.key as 'name' | 'department' | 'designation') : undefined}
                        >
                          <div className="flex items-center gap-1">
                            <span>{column.label}</span>
                            {column.sortable && (
                              <div className="flex flex-col">
                                <ChevronUp
                                  className={`h-3 w-3 ${sortBy === column.key && sortOrder === 'asc' ? 'text-blue-600' : 'text-gray-300'}`}
                                />
                                <ChevronDown
                                  className={`h-3 w-3 -mt-1 ${sortBy === column.key && sortOrder === 'desc' ? 'text-blue-600' : 'text-gray-300'}`}
                                />
                              </div>
                            )}
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedEmployees.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={tableColumns.length} className="px-6 py-12 text-center text-gray-500">
                          {searchQuery ? 'No employees found matching your search.' : 'No employees to display.'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAndSortedEmployees.map((employee, index) => (
                        <TableRow
                          key={employee.id}
                          className={`
                            hover:bg-gray-50/50 transition-colors cursor-pointer
                            ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/20'}
                          `}
                          onClick={() => employee.id && navigate(`/employees/${employee.id}`)}
                        >
                          {tableColumns.map((column) => (
                            <TableCell
                              key={column.key}
                              className="px-6 py-4 border-b border-gray-200"
                              onClick={column.key === 'actions' ? (e) => e.stopPropagation() : undefined} // Only prevent row click for actions column
                            >
                              {column.render(employee)}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Employee</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-600">
              Are you sure you want to delete this employee? This action cannot be undone.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteEmployee}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
