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
import { generateEmployeeId } from './helpers';
import type { Employee, CreateEmployeeData, UpdateEmployeeData } from './types';

const COLLECTION_NAME = 'employees';

function getCollection() {
  return collection(db, COLLECTION_NAME);
}

export async function getAllEmployees(): Promise<Employee[]> {
  try {
    const q = query(getCollection(), orderBy('createdAt', 'desc'));
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

export async function getEmployeeById(id: string): Promise<Employee | null> {
  try {
    const docRef = doc(getCollection(), id);
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

export async function createEmployee(employeeData: CreateEmployeeData): Promise<Employee> {
  try {
    const now = Timestamp.now();
    const employeeId = generateEmployeeId();
    const docData = {
      ...employeeData,
      employeeId,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(getCollection(), docData);

    return {
      id: docRef.id,
      ...employeeData,
      employeeId,
      createdAt: now.toDate().toISOString(),
      updatedAt: now.toDate().toISOString(),
    };
  } catch (error) {
    console.error('Error creating employee:', error);
    throw new Error('Failed to create employee');
  }
}

export async function updateEmployee(id: string, employeeData: UpdateEmployeeData): Promise<Employee> {
  try {
    const docRef = doc(getCollection(), id);
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

export async function deleteEmployee(id: string): Promise<void> {
  try {
    const docRef = doc(getCollection(), id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting employee:', error);
    throw new Error('Failed to delete employee');
  }
}

export async function getEmployeesByDepartment(department: string): Promise<Employee[]> {
  try {
    const q = query(
      getCollection(),
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
