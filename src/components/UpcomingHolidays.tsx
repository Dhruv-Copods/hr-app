import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from 'lucide-react';
import { formatDateShort, getDaysUntil, getHolidayTypeColor, capitalizeFirstLetter } from '@/lib/helpers';
import type { Holiday } from '@/lib/types';

interface UpcomingHolidaysProps {
  holidays: Holiday[];
}

export const UpcomingHolidays: React.FC<UpcomingHolidaysProps> = ({ holidays }) => {

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Upcoming Holidays
        </CardTitle>
        <CardDescription>Next 30 days</CardDescription>
      </CardHeader>
      <CardContent>
        {holidays.length > 0 ? (
          <div className="space-y-3">
            {holidays.slice(0, 5).map((holiday) => (
              <div key={holiday.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{holiday.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateShort(holiday.date)} • {getDaysUntil(holiday.date)} days away
                    </p>
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className={`text-xs ${getHolidayTypeColor(holiday.type)}`}
                >
                  {capitalizeFirstLetter(holiday.type)}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <Calendar className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No upcoming holidays</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
