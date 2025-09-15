import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, CalendarDays, Plus, Trash2, Edit3, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Holiday, HolidayType, CreateHolidayData } from '@/lib/types';
import { useSettings } from '@/hooks/SettingsContext';
import { toast } from 'sonner';
import { format } from 'date-fns';

export const HolidaysTab: React.FC = () => {
  const { settings, loading, addHoliday, updateHoliday, removeHoliday } = useSettings();

  // Holiday management state
  const [newHoliday, setNewHoliday] = useState<CreateHolidayData>({
    date: '',
    name: '',
    type: 'holiday',
    description: '',
  });
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isHolidaySaving, setIsHolidaySaving] = useState(false);

  // Holiday editing state
  const [editingHolidayId, setEditingHolidayId] = useState<string | null>(null);
  const [editingHolidayData, setEditingHolidayData] = useState<CreateHolidayData>({
    date: '',
    name: '',
    type: 'holiday',
    description: '',
  });
  const [editingHolidayDate, setEditingHolidayDate] = useState<Date | undefined>(undefined);

  // Holiday management functions
  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      setNewHoliday(prev => ({
        ...prev,
        date: format(date, 'yyyy-MM-dd'),
      }));
    }
  };

  const handleAddHoliday = async () => {
    if (!newHoliday.name.trim() || !newHoliday.date) {
      toast.error('Please provide a holiday name and date');
      return;
    }

    setIsHolidaySaving(true);
    try {
      await addHoliday(newHoliday);

      // Reset form
      setNewHoliday({
        date: '',
        name: '',
        type: 'holiday',
        description: '',
      });
      setSelectedDate(undefined);
    } catch (error) {
      console.error('Failed to add holiday:', error);
      // Error toast is handled by the context
    } finally {
      setIsHolidaySaving(false);
    }
  };

  const handleRemoveHoliday = async (holidayId: string) => {
    try {
      await removeHoliday(holidayId);
    } catch (error) {
      console.error('Failed to remove holiday:', error);
      // Error toast is handled by the context
    }
  };

  // Holiday editing functions
  const handleStartEditHoliday = (holiday: Holiday) => {
    setEditingHolidayId(holiday.id);
    setEditingHolidayData({
      date: holiday.date,
      name: holiday.name,
      type: holiday.type,
      description: holiday.description || '',
    });
    setEditingHolidayDate(new Date(holiday.date));
  };

  const handleCancelEditHoliday = () => {
    setEditingHolidayId(null);
    setEditingHolidayData({
      date: '',
      name: '',
      type: 'holiday',
      description: '',
    });
    setEditingHolidayDate(undefined);
  };

  const handleSaveEditedHoliday = async () => {
    if (!editingHolidayId || !editingHolidayData.name.trim() || !editingHolidayData.date) {
      toast.error('Please provide a holiday name and date');
      return;
    }

    try {
      await updateHoliday(editingHolidayId, editingHolidayData);
      setEditingHolidayId(null);
      setEditingHolidayData({
        date: '',
        name: '',
        type: 'holiday',
        description: '',
      });
      setEditingHolidayDate(undefined);
    } catch (error) {
      console.error('Failed to save edited holiday:', error);
      // Error toast is handled by the context
    }
  };

  const handleEditingHolidayDateSelect = (date: Date | undefined) => {
    setEditingHolidayDate(date);
    if (date) {
      setEditingHolidayData(prev => ({
        ...prev,
        date: format(date, 'yyyy-MM-dd'),
      }));
    }
  };

  // Helper function to check if a date already has a holiday
  const isDateDisabled = (date: Date) => {
    if (!settings) return false;
    const dateString = format(date, 'yyyy-MM-dd');
    return settings.holidays.some(holiday => holiday.date === dateString);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="text-center">
          <div className="text-gray-600">Loading holidays...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full">
      <Card className='py-0 pt-6 h-full'>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-6 w-6" />
            Company Holidays
          </CardTitle>
          <CardDescription>
            Manage holidays and non-working days for your organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add Holiday Form */}
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <h4 className="text-sm font-medium text-gray-900 mb-4">Add New Holiday</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Holiday Name</Label>
                <Input
                  value={newHoliday.name}
                  onChange={(e) => setNewHoliday(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., New Year's Day"
                />
              </div>

              <div className="space-y-2">
                <Label>Holiday Type</Label>
                <Select
                  value={newHoliday.type}
                  onValueChange={(value: HolidayType) => setNewHoliday(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="holiday">Holiday</SelectItem>
                    <SelectItem value="optional">Optional Holiday</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "MMM d, yyyy") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDateSelect}
                      showOutsideDays={false}
                      disabled={isDateDisabled}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2 flex items-end">
                <Button
                  onClick={handleAddHoliday}
                  disabled={!newHoliday.name.trim() || !newHoliday.date || isHolidaySaving}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {isHolidaySaving ? 'Adding...' : 'Add Holiday'}
                </Button>
              </div>
            </div>

            <div className="mt-2">
              <Label>Description (Optional)</Label>
              <Input
                value={newHoliday.description}
                onChange={(e) => setNewHoliday(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Additional details about the holiday"
                className="mt-1"
              />
            </div>
          </div>

          {/* Holidays List */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-4">
              Current Holidays ({settings?.holidays.length || 0})
            </h4>

            {settings?.holidays.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No holidays configured</p>
                <p className="text-sm">Add holidays above to mark them as non-working days</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {settings?.holidays
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .map((holiday) => (
                    <div
                      key={holiday.id}
                      className="border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors"
                    >
                      {editingHolidayId === holiday.id ? (
                        // Edit mode
                        <div className="p-4 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Holiday Name *</Label>
                              <Input
                                value={editingHolidayData.name}
                                onChange={(e) => setEditingHolidayData(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="e.g., New Year's Day"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Holiday Type</Label>
                              <Select
                                value={editingHolidayData.type}
                                onValueChange={(value: HolidayType) => setEditingHolidayData(prev => ({ ...prev, type: value }))}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="holiday">Holiday</SelectItem>
                                  <SelectItem value="optional">Optional Holiday</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Holiday Date *</Label>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-full justify-start text-left font-normal",
                                      !editingHolidayDate && "text-muted-foreground"
                                    )}
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {editingHolidayDate ? format(editingHolidayDate, "PPP") : "Pick a date"}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={editingHolidayDate}
                                    onSelect={handleEditingHolidayDateSelect}
                                    showOutsideDays={false}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                            </div>
                            <div className="space-y-2">
                              <Label>Description (Optional)</Label>
                              <Input
                                value={editingHolidayData.description}
                                onChange={(e) => setEditingHolidayData(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Additional details"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2 justify-end">
                            <Button
                              onClick={handleSaveEditedHoliday}
                              size="sm"
                              className="flex items-center gap-1"
                            >
                              <Check className="h-3 w-3" />
                              Save
                            </Button>
                            <Button
                              onClick={handleCancelEditHoliday}
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-1"
                            >
                              <X className="h-3 w-3" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        // View mode
                        <div className="flex items-center justify-between p-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">{holiday.name}</span>
                                {holiday.type !== 'holiday' && (
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "text-xs border-0",
                                      "bg-amber-100 text-amber-800 hover:bg-amber-200"
                                    )}
                                  >
                                    Optional
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              {format(new Date(holiday.date), 'EEEE, MMMM d, yyyy')}
                              {holiday.description && (
                                <span className="ml-2 text-gray-500">• {holiday.description}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleStartEditHoliday(holiday)}
                              variant="ghost"
                              size="sm"
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => handleRemoveHoliday(holiday.id)}
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
