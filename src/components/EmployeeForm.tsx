import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { type Employee, type CreateEmployeeData, DEPARTMENTS, DEPARTMENT_DESIGNATIONS } from '@/lib/types';
import { useEmployee } from '@/hooks/EmployeeContext';

const employeeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  employeeType: z.enum(['employee', 'consultant'], { message: 'Employee type is required' }),
  department: z.string().min(1, 'Department is required'),
  designation: z.string().min(1, 'Designation is required'),
  dateOfJoining: z.string().min(1, 'Date of joining is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  currentAddress: z.string().min(1, 'Current address is required'),
  permanentAddress: z.string().min(1, 'Permanent address is required'),
  officialEmail: z.string().email('Invalid official email address'),
  personalEmail: z.string().email('Invalid personal email address'),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

interface EmployeeFormProps {
  open: boolean;
  onClose: () => void;
  employee?: Employee | null;
}

export const EmployeeForm: React.FC<EmployeeFormProps> = ({
  open,
  onClose,
  employee,
}) => {
  const { createEmployee, updateEmployee } = useEmployee();
  const [loading, setLoading] = useState(false);
  const isEditing = !!employee;
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');

  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      name: '',
      employeeType: 'employee',
      department: '',
      designation: '',
      dateOfJoining: '',
      dateOfBirth: '',
      currentAddress: '',
      permanentAddress: '',
      officialEmail: '',
      personalEmail: '',
    },
  });

  useEffect(() => {
    if (employee && open) {
      form.reset({
        name: employee.name,
        employeeType: employee.employeeType,
        department: employee.department,
        designation: employee.designation,
        dateOfJoining: employee.dateOfJoining,
        dateOfBirth: employee.dateOfBirth,
        currentAddress: employee.currentAddress,
        permanentAddress: employee.permanentAddress,
        officialEmail: employee.officialEmail,
        personalEmail: employee.personalEmail,
      });
      setSelectedDepartment(employee.department);
    } else if (!employee && open) {
      form.reset({
        name: '',
        employeeType: 'employee',
        department: '',
        designation: '',
        dateOfJoining: '',
        dateOfBirth: '',
        currentAddress: '',
        permanentAddress: '',
        officialEmail: '',
        personalEmail: '',
      });
      setSelectedDepartment('');
    }
  }, [employee, open, form]);

  // Watch for department changes to reset designation
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'department') {
        const newDepartment = value.department;
        setSelectedDepartment(newDepartment || '');
        // Reset designation when department changes
        if (newDepartment !== selectedDepartment) {
          form.setValue('designation', '');
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form, selectedDepartment]);

  const onSubmit = async (data: EmployeeFormData) => {
    try {
      setLoading(true);

      if (isEditing && employee?.id) {
        await updateEmployee(employee.id, data);
      } else {
        await createEmployee(data as CreateEmployeeData);
      }

      onClose();
    } catch (error) {
      console.error('Error saving employee:', error);
      // Error handling is done in the context
    } finally {
      setLoading(false);
    }
  };


  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] mx-4 sm:mx-6 flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>
            {isEditing ? 'Edit Employee' : 'Add New Employee'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update employee information below.'
              : 'Fill in the details to add a new employee to your database.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-6">
                  <FormField
                    control={form.control}
                    name="officialEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Official Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="john.doe@company.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="personalEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Personal Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="john.doe@gmail.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Department and Designation */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {DEPARTMENTS.map((dept) => (
                              <SelectItem key={dept} value={dept}>
                                {dept}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="designation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Designation</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={!selectedDepartment}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder={selectedDepartment ? "Select designation" : "Select department first"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {selectedDepartment && DEPARTMENT_DESIGNATIONS[selectedDepartment as keyof typeof DEPARTMENT_DESIGNATIONS]?.map((desig) => (
                              <SelectItem key={desig} value={desig}>
                                {desig}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Date Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FormField
                    control={form.control}
                    name="dateOfJoining"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Joining</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal h-10",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(new Date(field.value), "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value ? new Date(field.value) : undefined}
                              onSelect={(date) => {
                                field.onChange(date ? format(date, 'yyyy-MM-dd') : '');
                              }}
                              showOutsideDays={false}
                              disabled={(date) => date > new Date()}
                              initialFocus
                              captionLayout="dropdown"
                              fromYear={1950}
                              toYear={new Date().getFullYear()}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Birth</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal h-10",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(new Date(field.value), "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value ? new Date(field.value) : undefined}
                              onSelect={(date) => {
                                field.onChange(date ? format(date, 'yyyy-MM-dd') : '');
                              }}
                              showOutsideDays={false}
                              disabled={(date) => date > new Date()}
                              initialFocus
                              captionLayout="dropdown"
                              fromYear={1920}
                              toYear={new Date().getFullYear()}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="currentAddress"
                  render={({ field }) => (
                    <FormItem className="mb-6">
                      <FormLabel>Current Address</FormLabel>
                      <FormControl>
                        <Textarea placeholder="123 Main Street, New York, NY 10001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="permanentAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Permanent Address</FormLabel>
                      <FormControl>
                        <Textarea placeholder="456 Oak Avenue, Springfield, IL 62701" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Consultant Toggle */}
              <div className="flex items-center gap-3">
                <label
                  htmlFor="isConsultant"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Consultant
                </label>
                <Switch
                  id="isConsultant"
                  checked={form.watch('employeeType') === 'consultant'}
                  onCheckedChange={(checked) => {
                    form.setValue('employeeType', checked ? 'consultant' : 'employee');
                  }}
                />
              </div>

            </form>
          </Form>
        </div>

        <DialogFooter className="flex justify-end flex-shrink-0">
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} onClick={form.handleSubmit(onSubmit)}>
              {loading ? 'Saving...' : (isEditing ? 'Update Employee' : 'Add Employee')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
