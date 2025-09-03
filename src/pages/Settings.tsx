import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Loader2, Calendar as CalendarIcon, Plus, Trash2, Save, Clock, CalendarDays, Edit3, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CompanySettings, Holiday, HolidayType, CreateHolidayData } from '@/lib/types';
import { SettingsService } from '@/lib/settingsService';
import { toast } from 'sonner';
import { format } from 'date-fns';

export const Settings: React.FC = () => {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Leave policy state
  const [leaveSettings, setLeaveSettings] = useState({
    ptoYearly: 20,
    ptoMonthly: 2,
    wfhYearly: 12,
    wfhMonthly: 1,
  });
  const [isLeaveSaving, setIsLeaveSaving] = useState(false);

  // Holiday management state
  const [newHoliday, setNewHoliday] = useState<CreateHolidayData>({
    date: '',
    name: '',
    type: 'optional',
    description: '',
  });
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isHolidaySaving, setIsHolidaySaving] = useState(false);

  // Holiday editing state
  const [editingHolidayId, setEditingHolidayId] = useState<string | null>(null);
  const [editingHolidayData, setEditingHolidayData] = useState<CreateHolidayData>({
    date: '',
    name: '',
    type: 'optional',
    description: '',
  });
  const [editingHolidayDate, setEditingHolidayDate] = useState<Date | undefined>(undefined);

  // Load settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        const loadedSettings = await SettingsService.initializeSettings();
        setSettings(loadedSettings);
        setLeaveSettings({
          ptoYearly: loadedSettings.ptoYearly,
          ptoMonthly: loadedSettings.ptoMonthly,
          wfhYearly: loadedSettings.wfhYearly,
          wfhMonthly: loadedSettings.wfhMonthly,
        });
      } catch (error) {
        console.error('Error loading settings:', error);
        toast.error('Failed to load settings. Using defaults.');
        const defaultSettings: CompanySettings = {
          ptoYearly: 20,
          ptoMonthly: 2,
          wfhYearly: 12,
          wfhMonthly: 1,
          holidays: [],
        };
        setSettings(defaultSettings);
        setLeaveSettings({
          ptoYearly: 20,
          ptoMonthly: 2,
          wfhYearly: 12,
          wfhMonthly: 1,
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Leave settings functions
  const handleLeaveSettingChange = (field: keyof typeof leaveSettings, value: string) => {
    const numValue = parseInt(value) || 0;
    setLeaveSettings(prev => ({
      ...prev,
      [field]: numValue
    }));
  };

  const handleSaveLeaveSettings = async () => {
    if (!settings) return;

    setIsLeaveSaving(true);
    try {
      const savedSettings = await SettingsService.updateSettings({
        ...settings,
        ...leaveSettings,
      });
      setSettings(savedSettings);
      toast.success('Leave policies saved successfully!');
    } catch (error) {
      console.error('Failed to save leave settings:', error);
      toast.error('Failed to save leave policies. Please try again.');
    } finally {
      setIsLeaveSaving(false);
    }
  };

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
    if (!settings) return;

    if (!newHoliday.name.trim() || !newHoliday.date) {
      toast.error('Please provide a holiday name and date');
      return;
    }

    // Check for duplicate dates in existing settings
    const existingHoliday = settings.holidays.find(h => h.date === newHoliday.date);
    if (existingHoliday) {
      toast.error('A holiday already exists for this date');
      return;
    }

    setIsHolidaySaving(true);
    try {
      const holiday: Holiday = {
        id: `holiday-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...newHoliday,
      };

      const savedSettings = await SettingsService.updateSettings({
        ...settings,
        holidays: [...settings.holidays, holiday],
      });

      setSettings(savedSettings);

      // Reset form
      setNewHoliday({
        date: '',
        name: '',
        type: 'optional',
        description: '',
      });
      setSelectedDate(undefined);

      toast.success('Holiday added successfully!');
    } catch (error) {
      console.error('Failed to add holiday:', error);
      toast.error('Failed to add holiday. Please try again.');
    } finally {
      setIsHolidaySaving(false);
    }
  };

  const handleRemoveHoliday = async (holidayId: string) => {
    if (!settings) return;

    try {
      const updatedHolidays = settings.holidays.filter(h => h.id !== holidayId);
      const savedSettings = await SettingsService.updateSettings({
        ...settings,
        holidays: updatedHolidays,
      });

      setSettings(savedSettings);
      toast.success('Holiday removed successfully!');
    } catch (error) {
      console.error('Failed to remove holiday:', error);
      toast.error('Failed to remove holiday. Please try again.');
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
      type: 'optional',
      description: '',
    });
    setEditingHolidayDate(undefined);
  };

  const handleSaveEditedHoliday = async () => {
    if (!editingHolidayId || !editingHolidayData.name.trim() || !editingHolidayData.date || !settings) {
      toast.error('Please provide a holiday name and date');
      return;
    }

    try {
      const updatedHolidays = settings.holidays.map(h =>
        h.id === editingHolidayId
          ? { ...h, ...editingHolidayData }
          : h
      );

      const savedSettings = await SettingsService.updateSettings({
        ...settings,
        holidays: updatedHolidays,
      });

      setSettings(savedSettings);
      setEditingHolidayId(null);
      setEditingHolidayData({
        date: '',
        name: '',
        type: 'optional',
        description: '',
      });
      setEditingHolidayDate(undefined);

      toast.success('Holiday updated successfully!');
    } catch (error) {
      console.error('Failed to save edited holiday:', error);
      toast.error('Failed to save holiday changes. Please try again.');
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

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex justify-center items-center h-full">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <span className="text-gray-600">Loading settings...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex justify-center items-center h-full">
          <div className="text-center">
            <p className="text-gray-600">Failed to load settings. Please refresh the page.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="mt-2 text-gray-600">Manage your HR application settings</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-1">
        <Tabs defaultValue="leave" className="h-full">
          <TabsList className="flex w-fit">
            <TabsTrigger value="leave" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Leave Policies
            </TabsTrigger>
            <TabsTrigger value="holidays" className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Holidays
            </TabsTrigger>
          </TabsList>

          {/* Leave Policies Tab */}
          <TabsContent value="leave" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-6 w-6" />
                  Leave Policies
                </CardTitle>
                <CardDescription>
                  Configure PTO and WFH policies for your employees
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* PTO Settings */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Paid Time Off (PTO)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="pto-yearly">Maximum PTO per Year</Label>
                      <Input
                        id="pto-yearly"
                        type="number"
                        min="0"
                        value={leaveSettings.ptoYearly}
                        onChange={(e) => handleLeaveSettingChange('ptoYearly', e.target.value)}
                        placeholder="Enter maximum PTO days per year"
                      />
                      <p className="text-sm text-gray-500">Total PTO days an employee can take in a calendar year</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pto-monthly">Maximum PTO per Month</Label>
                      <Input
                        id="pto-monthly"
                        type="number"
                        min="0"
                        value={leaveSettings.ptoMonthly}
                        onChange={(e) => handleLeaveSettingChange('ptoMonthly', e.target.value)}
                        placeholder="Enter maximum PTO days per month"
                      />
                      <p className="text-sm text-gray-500">Maximum PTO days an employee can take in a single month</p>
                    </div>
                  </div>
                </div>

                {/* WFH Settings */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Work From Home (WFH)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="wfh-yearly">Maximum WFH per Year</Label>
                      <Input
                        id="wfh-yearly"
                        type="number"
                        min="0"
                        value={leaveSettings.wfhYearly}
                        onChange={(e) => handleLeaveSettingChange('wfhYearly', e.target.value)}
                        placeholder="Enter maximum WFH days per year"
                      />
                      <p className="text-sm text-gray-500">Total WFH days an employee can take in a calendar year</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="wfh-monthly">Maximum WFH per Month</Label>
                      <Input
                        id="wfh-monthly"
                        type="number"
                        min="0"
                        value={leaveSettings.wfhMonthly}
                        onChange={(e) => handleLeaveSettingChange('wfhMonthly', e.target.value)}
                        placeholder="Enter maximum WFH days per month"
                      />
                      <p className="text-sm text-gray-500">Maximum WFH days an employee can take in a single month</p>
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                  <Button
                    onClick={handleSaveLeaveSettings}
                    disabled={isLeaveSaving}
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {isLeaveSaving ? 'Saving...' : 'Save Leave Policies'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Holidays Tab */}
          <TabsContent value="holidays" className="space-y-6">
            <Card>
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
                          <SelectItem value="government">Government Holiday</SelectItem>
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
                      {settings.holidays
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
                                        <SelectItem value="government">Government Holiday</SelectItem>
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
                                      <Badge
                                        variant={holiday.type === 'government' ? 'destructive' : 'secondary'}
                                        className="text-xs"
                                      >
                                        {holiday.type === 'government' ? 'Government' : 'Optional'}
                                      </Badge>
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
