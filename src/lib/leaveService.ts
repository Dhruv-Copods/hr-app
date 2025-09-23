import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { filterRecordsByDateRange, removeUndefinedValues, isOptionalHoliday } from './helpers';
import type { LeaveRecord, CreateLeaveRecordData, UpdateLeaveRecordData, Holiday } from './types';
import { updateEmployeeOptionalLeaves } from './employeeService';

const COLLECTION_NAME = 'leaveRecords';

function getCollection() {
  return collection(db, COLLECTION_NAME);
}

export async function getAllLeaveRecords(): Promise<LeaveRecord[]> {
  try {
    const q = query(getCollection(), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
      approvedAt: doc.data().approvedAt?.toDate?.()?.toISOString() || doc.data().approvedAt,
    })) as LeaveRecord[];
  } catch (error) {
    console.error('Error fetching leave records:', error);
    throw new Error('Failed to fetch leave records');
  }
}

export async function getLeaveRecordById(id: string): Promise<LeaveRecord | null> {
  try {
    const docRef = doc(getCollection(), id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate?.()?.toISOString() || docSnap.data().createdAt,
        updatedAt: docSnap.data().updatedAt?.toDate?.()?.toISOString() || docSnap.data().updatedAt,
        approvedAt: docSnap.data().approvedAt?.toDate?.()?.toISOString() || docSnap.data().approvedAt,
      } as LeaveRecord;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error fetching leave record:', error);
    throw new Error('Failed to fetch leave record');
  }
}

export async function getLeaveRecordsByEmployee(employeeId: string): Promise<LeaveRecord[]> {
  try {
    const q = query(
      getCollection(),
      where('employeeId', '==', employeeId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
      approvedAt: doc.data().approvedAt?.toDate?.()?.toISOString() || doc.data().approvedAt,
    })) as LeaveRecord[];
  } catch (error) {
    console.error('Error fetching leave records by employee:', error);
    throw new Error('Failed to fetch leave records by employee');
  }
}

export async function createLeaveRecord(leaveData: CreateLeaveRecordData, holidays: Holiday[] = []): Promise<LeaveRecord> {
  try {
    // Validate that employeeId is provided and not empty
    if (!leaveData.employeeId || leaveData.employeeId.trim() === '') {
      throw new Error('Employee ID is required to create a leave record');
    }

    const now = Timestamp.now();

    // Count optional holidays taken in this leave record
    let totalOptionalHolidaysCount = 0;

    // Check each day in the leave record for optional holidays
    Object.keys(leaveData.days).forEach(dateKey => {
      const date = new Date(dateKey);
      const optionalHoliday = isOptionalHoliday(date, holidays);
      const dayType = leaveData.days[dateKey];
      
      if (optionalHoliday && dayType === 'leave') {
        // Only count optional holidays as taken when they are leave days, not WFH
        totalOptionalHolidaysCount++;
      }
    });

    // Filter out undefined values to prevent Firebase errors
    const cleanData = removeUndefinedValues(leaveData);

    const docData = {
      ...cleanData,
      optionalHolidaysTaken: totalOptionalHolidaysCount,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(getCollection(), docData);

    // Update employee's optional leaves taken count if any optional holidays were taken
    if (totalOptionalHolidaysCount > 0) {
      const currentYear = new Date().getFullYear().toString();
      await updateEmployeeOptionalLeaves(leaveData.employeeId, currentYear, totalOptionalHolidaysCount);
    }

    return {
      id: docRef.id,
      ...cleanData,
      optionalHolidaysTaken: totalOptionalHolidaysCount,
      createdAt: now.toDate().toISOString(),
      updatedAt: now.toDate().toISOString(),
    } as LeaveRecord;
  } catch (error) {
    console.error('Error creating leave record:', error);
    throw new Error('Failed to create leave record');
  }
}

export async function updateLeaveRecord(id: string, leaveData: UpdateLeaveRecordData, holidays: Holiday[] = []): Promise<LeaveRecord> {
  try {
    // Validate that we're not trying to update employeeId to an invalid value
    if (leaveData.employeeId !== undefined && (!leaveData.employeeId || leaveData.employeeId.trim() === '')) {
      throw new Error('Employee ID cannot be empty when updating a leave record');
    }

    // Get the current leave record to compare optional holidays
    const currentRecord = await getLeaveRecordById(id);
    if (!currentRecord) {
      throw new Error('Leave record not found');
    }

    const docRef = doc(getCollection(), id);
    const now = Timestamp.now();

    // Calculate new optional holidays count if days are being updated
    let newOptionalHolidaysCount = currentRecord.optionalHolidaysTaken || 0;
    
    if (leaveData.days) {
      // Recalculate optional holidays count based on new days
      newOptionalHolidaysCount = 0;
      Object.keys(leaveData.days).forEach(dateKey => {
        const date = new Date(dateKey);
        const optionalHoliday = isOptionalHoliday(date, holidays);
        const dayType = leaveData.days![dateKey];
        
        if (optionalHoliday && dayType === 'leave') {
          newOptionalHolidaysCount++;
        }
      });
    }

    // Calculate the difference in optional holidays
    const optionalHolidaysDifference = newOptionalHolidaysCount - (currentRecord.optionalHolidaysTaken || 0);

    // Update employee's optional leave count if there's a difference
    if (optionalHolidaysDifference !== 0) {
      const currentYear = new Date().getFullYear().toString();
      await updateEmployeeOptionalLeaves(currentRecord.employeeId, currentYear, optionalHolidaysDifference);
    }

    // Filter out undefined values to prevent Firebase errors
    const cleanData = removeUndefinedValues(leaveData);

    const updateData = {
      ...cleanData,
      optionalHolidaysTaken: newOptionalHolidaysCount,
      updatedAt: now,
    };

    await updateDoc(docRef, updateData);

    const updatedDoc = await getDoc(docRef);
    return {
      id: updatedDoc.id,
      ...updatedDoc.data(),
      createdAt: updatedDoc.data()?.createdAt?.toDate?.()?.toISOString() || updatedDoc.data()?.createdAt,
      updatedAt: now.toDate().toISOString(),
      approvedAt: updatedDoc.data()?.approvedAt?.toDate?.()?.toISOString() || updatedDoc.data()?.approvedAt,
    } as LeaveRecord;
  } catch (error) {
    console.error('Error updating leave record:', error);
    throw new Error('Failed to update leave record');
  }
}

export async function deleteLeaveRecord(id: string): Promise<void> {
  try {
    // First, get the leave record to check for optional holidays
    const leaveRecord = await getLeaveRecordById(id);
    
    if (!leaveRecord) {
      throw new Error('Leave record not found');
    }

    // If the leave record has optional holidays taken, update the employee's count
    if (leaveRecord.optionalHolidaysTaken && leaveRecord.optionalHolidaysTaken > 0) {
      const currentYear = new Date().getFullYear().toString();
      // Subtract the optional holidays taken from the employee's count
      await updateEmployeeOptionalLeaves(leaveRecord.employeeId, currentYear, -leaveRecord.optionalHolidaysTaken);
    }

    // Delete the leave record
    const docRef = doc(getCollection(), id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting leave record:', error);
    throw new Error('Failed to delete leave record');
  }
}

export async function approveLeaveRecord(id: string, approvedBy: string): Promise<LeaveRecord> {
  try {
    const now = Timestamp.now();
    const updateData = {
      approved: true,
      approvedBy,
      approvedAt: now.toDate().toISOString(),
    };
    return await updateLeaveRecord(id, updateData);
  } catch (error) {
    console.error('Error approving leave record:', error);
    throw new Error('Failed to approve leave record');
  }
}

export async function getLeaveRecordsByDateRange(startDate: string, endDate: string): Promise<LeaveRecord[]> {
  try {
    // Since Firestore doesn't support complex date range queries on multiple fields easily,
    // we'll fetch all records and filter client-side for now
    const allRecords = await getAllLeaveRecords();

    return filterRecordsByDateRange(allRecords, startDate, endDate);
  } catch (error) {
    console.error('Error fetching leave records by date range:', error);
    throw new Error('Failed to fetch leave records by date range');
  }
}
