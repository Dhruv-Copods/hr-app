import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Building2, PieChart } from 'lucide-react';

interface EmployeeStatsProps {
  totalEmployees: number;
  departmentStats: Record<string, number>;
}

export const EmployeeStats: React.FC<EmployeeStatsProps> = ({
  totalEmployees,
  departmentStats
}) => {
  const departments = Object.entries(departmentStats).sort(([,a], [,b]) => b - a);

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Total Employees */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalEmployees}</div>
          <p className="text-xs text-muted-foreground">
            Active employees in the organization
          </p>
        </CardContent>
      </Card>

      {/* Department Breakdown */}
      <Card className="md:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Department Breakdown</CardTitle>
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {departments.map(([department, count]) => (
              <div key={department} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <PieChart className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm font-medium">{department}</span>
                </div>
                <Badge variant="secondary">{count}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
