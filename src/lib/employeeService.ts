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
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import type { Employee, CreateEmployeeData, UpdateEmployeeData } from './types';

const COLLECTION_NAME = 'employees';

export class EmployeeService {
  private static getCollection() {
    return collection(db, COLLECTION_NAME);
  }

  static async getAllEmployees(): Promise<Employee[]> {
    try {
      const q = query(this.getCollection(), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
      })) as Employee[];
    } catch (error) {
      console.error('Error fetching employees:', error);
      throw new Error('Failed to fetch employees');
    }
  }

  static async getEmployeeById(id: string): Promise<Employee | null> {
    try {
      const docRef = doc(this.getCollection(), id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
          createdAt: docSnap.data().createdAt?.toDate?.()?.toISOString() || docSnap.data().createdAt,
          updatedAt: docSnap.data().updatedAt?.toDate?.()?.toISOString() || docSnap.data().updatedAt,
        } as Employee;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error fetching employee:', error);
      throw new Error('Failed to fetch employee');
    }
  }

  static async createEmployee(employeeData: CreateEmployeeData): Promise<Employee> {
    try {
      const now = Timestamp.now();
      const docData = {
        ...employeeData,
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await addDoc(this.getCollection(), docData);

      return {
        id: docRef.id,
        ...employeeData,
        createdAt: now.toDate().toISOString(),
        updatedAt: now.toDate().toISOString(),
      };
    } catch (error) {
      console.error('Error creating employee:', error);
      throw new Error('Failed to create employee');
    }
  }

  static async updateEmployee(id: string, employeeData: UpdateEmployeeData): Promise<Employee> {
    try {
      const docRef = doc(this.getCollection(), id);
      const now = Timestamp.now();

      const updateData = {
        ...employeeData,
        updatedAt: now,
      };

      await updateDoc(docRef, updateData);

      const updatedDoc = await getDoc(docRef);
      return {
        id: updatedDoc.id,
        ...updatedDoc.data(),
        createdAt: updatedDoc.data()?.createdAt?.toDate?.()?.toISOString() || updatedDoc.data()?.createdAt,
        updatedAt: now.toDate().toISOString(),
      } as Employee;
    } catch (error) {
      console.error('Error updating employee:', error);
      throw new Error('Failed to update employee');
    }
  }

  static async deleteEmployee(id: string): Promise<void> {
    try {
      const docRef = doc(this.getCollection(), id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting employee:', error);
      throw new Error('Failed to delete employee');
    }
  }

  static async getEmployeesByDepartment(department: string): Promise<Employee[]> {
    try {
      const q = query(
        this.getCollection(),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
          updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
        }) as Employee)
        .filter(employee => employee.department === department);
    } catch (error) {
      console.error('Error fetching employees by department:', error);
      throw new Error('Failed to fetch employees by department');
    }
  }

  static async getEmployeesByStatus(status: string): Promise<Employee[]> {
    try {
      const q = query(
        this.getCollection(),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
          updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
        }) as Employee)
        .filter(employee => employee.status === status);
    } catch (error) {
      console.error('Error fetching employees by status:', error);
      throw new Error('Failed to fetch employees by status');
    }
  }
}
