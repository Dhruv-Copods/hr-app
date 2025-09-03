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
import type { LeaveRecord, CreateLeaveRecordData, UpdateLeaveRecordData } from './types';

const COLLECTION_NAME = 'leaveRecords';

export class LeaveService {
  private static getCollection() {
    return collection(db, COLLECTION_NAME);
  }

  static async getAllLeaveRecords(): Promise<LeaveRecord[]> {
    try {
      const q = query(this.getCollection(), orderBy('createdAt', 'desc'));
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

  static async getLeaveRecordById(id: string): Promise<LeaveRecord | null> {
    try {
      const docRef = doc(this.getCollection(), id);
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

  static async getLeaveRecordsByEmployee(employeeId: string): Promise<LeaveRecord[]> {
    try {
      const q = query(
        this.getCollection(),
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

  static async createLeaveRecord(leaveData: CreateLeaveRecordData): Promise<LeaveRecord> {
    try {
      // Validate that employeeId is provided and not empty
      if (!leaveData.employeeId || leaveData.employeeId.trim() === '') {
        throw new Error('Employee ID is required to create a leave record');
      }

      const now = Timestamp.now();

      // Filter out undefined values to prevent Firebase errors
      const cleanData = Object.fromEntries(
        Object.entries(leaveData).filter(([, value]) => value !== undefined)
      );

      const docData = {
        ...cleanData,
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await addDoc(this.getCollection(), docData);

      return {
        id: docRef.id,
        ...cleanData,
        createdAt: now.toDate().toISOString(),
        updatedAt: now.toDate().toISOString(),
      } as LeaveRecord;
    } catch (error) {
      console.error('Error creating leave record:', error);
      throw new Error('Failed to create leave record');
    }
  }

  static async updateLeaveRecord(id: string, leaveData: UpdateLeaveRecordData): Promise<LeaveRecord> {
    try {
      // Validate that we're not trying to update employeeId to an invalid value
      if (leaveData.employeeId !== undefined && (!leaveData.employeeId || leaveData.employeeId.trim() === '')) {
        throw new Error('Employee ID cannot be empty when updating a leave record');
      }

      const docRef = doc(this.getCollection(), id);
      const now = Timestamp.now();

      // Filter out undefined values to prevent Firebase errors
      const cleanData = Object.fromEntries(
        Object.entries(leaveData).filter(([, value]) => value !== undefined)
      );

      const updateData = {
        ...cleanData,
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

  static async deleteLeaveRecord(id: string): Promise<void> {
    try {
      const docRef = doc(this.getCollection(), id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting leave record:', error);
      throw new Error('Failed to delete leave record');
    }
  }

  static async approveLeaveRecord(id: string, approvedBy: string): Promise<LeaveRecord> {
    try {
      const now = Timestamp.now();
      const updateData = {
        approved: true,
        approvedBy,
        approvedAt: now.toDate().toISOString(),
      };
      return await this.updateLeaveRecord(id, updateData);
    } catch (error) {
      console.error('Error approving leave record:', error);
      throw new Error('Failed to approve leave record');
    }
  }

  static async getLeaveRecordsByDateRange(startDate: string, endDate: string): Promise<LeaveRecord[]> {
    try {
      // Since Firestore doesn't support complex date range queries on multiple fields easily,
      // we'll fetch all records and filter client-side for now
      const allRecords = await this.getAllLeaveRecords();

      return allRecords.filter(record => {
        const recordStart = new Date(record.startDate);
        const recordEnd = new Date(record.endDate);
        const filterStart = new Date(startDate);
        const filterEnd = new Date(endDate);

        // Check if the leave period overlaps with the filter period
        return recordStart <= filterEnd && recordEnd >= filterStart;
      });
    } catch (error) {
      console.error('Error fetching leave records by date range:', error);
      throw new Error('Failed to fetch leave records by date range');
    }
  }
}
