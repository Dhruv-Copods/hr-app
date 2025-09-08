import { format } from 'date-fns';
import type { Holiday, LeaveRecord } from './types';

/**
 * Centralized utility functions for the HR application
 * This file contains all helper functions that are not Firebase-specific
 */

/**
 * Generates a unique employee ID in the format EMP-XXXXXXXXXX
 * @returns A unique employee ID string
 */
export function generateEmployeeId(): string {
  const timestamp = Date.now().toString(36);
  const randomString = Math.random().toString(36).substr(2, 5);
  return `EMP-${timestamp}-${randomString}`.toUpperCase();
}

/**
 * Formats a date string into a long, readable format (e.g., "January 15, 2024")
 * @param dateString - The date string to format
 * @returns Formatted date string
 */
export function formatDateLong(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Formats a date string into a short format (e.g., "Jan 15, 2024")
 * @param dateString - The date string to format
 * @returns Formatted date string
 */
export function formatDateShort(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Calculates the number of days until a given date
 * @param dateString - The target date string
 * @returns Number of days until the target date
 */
export function getDaysUntil(dateString: string): number {
  const today = new Date();
  const targetDate = new Date(dateString);
  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Gets the appropriate color class for holiday types
 * @param type - The holiday type ('holiday' or 'observance')
 * @returns Tailwind CSS class string for styling
 */
export function getHolidayTypeColor(type: string): string {
  return type === 'holiday' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800';
}

/**
 * Capitalizes the first letter of a string
 * @param str - The string to capitalize
 * @returns String with first letter capitalized
 */
export function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Formats an employee name by truncating if too long
 * @param name - The employee name to format
 * @param maxLength - Maximum length before truncation (default: 25)
 * @returns Formatted employee name
 */
export function formatEmployeeName(name: string, maxLength: number = 25): string {
  return name.length > maxLength ? `${name.substring(0, maxLength - 3)}...` : name;
}

/**
 * Checks if a date range overlaps with another date range
 * @param recordStart - Start date of the record
 * @param recordEnd - End date of the record
 * @param filterStart - Start date of the filter range
 * @param filterEnd - End date of the filter range
 * @returns True if the date ranges overlap
 */
export function isDateRangeOverlap(
  recordStart: Date | string,
  recordEnd: Date | string,
  filterStart: Date | string,
  filterEnd: Date | string
): boolean {
  const start = new Date(recordStart);
  const end = new Date(recordEnd);
  const filterStartDate = new Date(filterStart);
  const filterEndDate = new Date(filterEnd);

  // Check if the leave period overlaps with the filter period
  return start <= filterEndDate && end >= filterStartDate;
}

/**
 * Filters records by date range
 * @param records - Array of records with startDate and endDate properties
 * @param startDate - Filter start date
 * @param endDate - Filter end date
 * @returns Filtered array of records
 */
export function filterRecordsByDateRange<T extends { startDate: string; endDate: string }>(
  records: T[],
  startDate: string,
  endDate: string
): T[] {
  return records.filter(record =>
    isDateRangeOverlap(record.startDate, record.endDate, startDate, endDate)
  );
}

/**
 * Validates if a string is not empty or just whitespace
 * @param value - The string to validate
 * @returns True if the string is valid (not empty)
 */
export function isValidString(value: string): boolean {
  return Boolean(value && value.trim() !== '');
}

/**
 * Removes undefined values from an object
 * @param obj - The object to clean
 * @returns Object with undefined values removed
 */
export function removeUndefinedValues<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined)
  ) as Partial<T>;
}

/**
 * Checks if a date is a holiday
 * @param date - The date to check
 * @param holidays - Array of holidays to check against
 * @returns The holiday object if found, null otherwise
 */
export function isHoliday(date: Date, holidays: Holiday[]): Holiday | null {
  const dateKey = format(date, 'yyyy-MM-dd');
  return holidays.find(holiday => holiday.date === dateKey && holiday.type === 'holiday') || null;
}

/**
 * Checks if a date is an optional holiday
 * @param date - The date to check
 * @param holidays - Array of holidays to check against
 * @returns The holiday object if found, null otherwise
 */
export function isOptionalHoliday(date: Date, holidays: Holiday[]): Holiday | null {
  const dateKey = format(date, 'yyyy-MM-dd');
  return holidays.find(holiday => holiday.date === dateKey && holiday.type === 'optional') || null;
}

/**
 * Checks if a date should be disabled based on existing leave records and holidays
 * @param date - The date to check
 * @param existingLeaveRecords - Array of existing leave records
 * @param holidays - Array of holidays
 * @returns True if the date should be disabled
 */
export function isDateDisabled(date: Date, existingLeaveRecords: LeaveRecord[], holidays: Holiday[]): boolean {
  const dateKey = format(date, 'yyyy-MM-dd');

  // Check if this date falls within any existing leave record
  for (const record of existingLeaveRecords) {
    const recordStart = new Date(record.startDate);
    const recordEnd = new Date(record.endDate);

    // If date is within the record's date range
    if (date >= recordStart && date <= recordEnd) {
      // Check if this specific date has leave or wfh
      const dayType = record.days[dateKey];
      if (dayType === 'leave' || dayType === 'wfh') {
        return true;
      }
    }
  }

  // Check if it's a holiday (these should be disabled)
  if (isHoliday(date, holidays)) {
    return true;
  }

  return false;
}
