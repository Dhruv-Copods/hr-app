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
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { EmployeeService } from '@/lib/employeeService';
import { type Employee, type CreateEmployeeData, DEPARTMENTS, DESIGNATIONS } from '@/lib/types';

const employeeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
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
  onSuccess: () => void;
}

export const EmployeeForm: React.FC<EmployeeFormProps> = ({
  open,
  onClose,
  employee,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const isEditing = !!employee;

  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      name: '',
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
        department: employee.department,
        designation: employee.designation,
        dateOfJoining: employee.dateOfJoining,
        dateOfBirth: employee.dateOfBirth,
        currentAddress: employee.currentAddress,
        permanentAddress: employee.permanentAddress,
        officialEmail: employee.officialEmail,
        personalEmail: employee.personalEmail,
      });
    } else if (!employee && open) {
      form.reset({
        name: '',
        department: '',
        designation: '',
        dateOfJoining: '',
        dateOfBirth: '',
        currentAddress: '',
        permanentAddress: '',
        officialEmail: '',
        personalEmail: '',
      });
    }
  }, [employee, open, form]);

  const onSubmit = async (data: EmployeeFormData) => {
    try {
      setLoading(true);

      if (isEditing && employee?.id) {
        await EmployeeService.updateEmployee(employee.id, data);
      } else {
        await EmployeeService.createEmployee(data as CreateEmployeeData);
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving employee:', error);
      // You could add toast notifications here
    } finally {
      setLoading(false);
    }
  };

  const fillWithSampleData = () => {
    const sampleData = {
      name: 'John Doe',
      department: 'Engineering',
      designation: 'Software Engineer',
      dateOfJoining: '2024-01-15',
      dateOfBirth: '1990-05-20',
      currentAddress: '123 Main Street, New York, NY 10001',
      permanentAddress: '456 Oak Avenue, Springfield, IL 62701',
      officialEmail: 'john.doe@company.com',
      personalEmail: 'john.doe@gmail.com',
    };

    form.reset(sampleData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] min-w-5xl flex flex-col">
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Basic Information</h3>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              {/* Employment Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Employment Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
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
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select designation" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {DESIGNATIONS.map((desig) => (
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                  "w-full pl-3 text-left font-normal",
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
                              disabled={(date) =>
                                date > new Date() || date < new Date("1900-01-01")
                              }
                              initialFocus
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
                                  "w-full pl-3 text-left font-normal",
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
                              disabled={(date) =>
                                date > new Date() || date < new Date("1900-01-01")
                              }
                              initialFocus
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
                <h3 className="text-lg font-medium">Address</h3>
                <FormField
                  control={form.control}
                  name="currentAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Address</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Main Street, New York, NY 10001" {...field} />
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
                        <Input placeholder="456 Oak Avenue, Springfield, IL 62701" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>


            </form>
          </Form>
        </div>

        <DialogFooter className="flex justify-between flex-shrink-0 border-t pt-6">
          <Button type="button" variant="secondary" onClick={fillWithSampleData}>
            Fill with Sample Data
          </Button>
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
