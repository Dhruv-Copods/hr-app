import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Clock, Save, Calendar } from 'lucide-react';
import { useSettings } from '@/hooks/SettingsContext';
import { toast } from 'sonner';

export const LeavePoliciesTab: React.FC = () => {
  const { settings, loading, updateLeaveSettings } = useSettings();

  // Leave policy state - sync with settings
  const [leaveSettings, setLeaveSettings] = useState({
    ptoYearly: 20,
    ptoMonthly: 2,
    wfhYearly: 12,
    wfhMonthly: 1,
    optionalHolidaysYearly: 5,
  });
  const [isLeaveSaving, setIsLeaveSaving] = useState(false);

  // Sync leave settings with context settings
  useEffect(() => {
    if (settings) {
      setLeaveSettings({
        ptoYearly: settings.ptoYearly,
        ptoMonthly: settings.ptoMonthly,
        wfhYearly: settings.wfhYearly,
        wfhMonthly: settings.wfhMonthly,
        optionalHolidaysYearly: settings.optionalHolidaysYearly,
      });
    }
  }, [settings]);

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
      await updateLeaveSettings(leaveSettings);
    } catch (error) {
      console.error('Failed to save leave settings:', error);
      toast.error('Failed to save leave policies. Please try again.');
    } finally {
      setIsLeaveSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="text-center">
          <div className="text-gray-600">Loading leave policies...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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

          {/* Optional Holidays Settings */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Optional Holidays
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="optional-holidays-yearly">Maximum Optional Holidays per Year</Label>
                <Input
                  id="optional-holidays-yearly"
                  type="number"
                  min="0"
                  value={leaveSettings.optionalHolidaysYearly}
                  onChange={(e) => handleLeaveSettingChange('optionalHolidaysYearly', e.target.value)}
                  placeholder="Enter maximum optional holidays per year"
                />
                <p className="text-sm text-gray-500">Total optional holidays an employee can take in a calendar year</p>
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
    </div>
  );
};
