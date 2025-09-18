import {
  doc,
  getDoc,
  setDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import type { CompanySettings } from './types';

const COLLECTION_NAME = 'settings';
const SETTINGS_DOC_ID = 'company-settings';

function getDocRef() {
  return doc(db, COLLECTION_NAME, SETTINGS_DOC_ID);
}

export async function getSettings(): Promise<CompanySettings | null> {
  try {
    const docSnap = await getDoc(getDocRef());

    if (docSnap.exists()) {
      const data = docSnap.data();
      // Ensure backward compatibility by adding holidays and optional holidays if missing
      const settings: CompanySettings = {
        ptoYearly: data.ptoYearly || 20,
        ptoMonthly: data.ptoMonthly || 2,
        wfhYearly: data.wfhYearly || 12,
        wfhMonthly: data.wfhMonthly || 1,
        optionalHolidaysYearly: data.optionalHolidaysYearly || 5,
        holidays: data.holidays || [],
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
        updatedBy: data.updatedBy,
      };
      return settings;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error fetching settings:', error);
    throw new Error('Failed to fetch settings');
  }
}

export async function updateSettings(settings: Partial<CompanySettings>, updatedBy?: string): Promise<CompanySettings> {
  try {
    const now = Timestamp.now();
    const docRef = getDocRef();

    // Get current settings first
    const currentSettings = await getSettings();
    const updatedSettings: CompanySettings = {
      ptoYearly: settings.ptoYearly ?? currentSettings?.ptoYearly ?? 20,
      ptoMonthly: settings.ptoMonthly ?? currentSettings?.ptoMonthly ?? 2,
      wfhYearly: settings.wfhYearly ?? currentSettings?.wfhYearly ?? 12,
      wfhMonthly: settings.wfhMonthly ?? currentSettings?.wfhMonthly ?? 1,
      optionalHolidaysYearly: settings.optionalHolidaysYearly ?? currentSettings?.optionalHolidaysYearly ?? 5,
      holidays: settings.holidays ?? currentSettings?.holidays ?? [],
      updatedAt: now.toDate().toISOString(),
      ...(updatedBy && { updatedBy }),
    };

    console.log('Saving settings to Firebase with holidays:', updatedSettings.holidays);

    // Use setDoc with merge to create or update the document
    await setDoc(docRef, updatedSettings, { merge: true });

    console.log('Successfully saved settings to Firebase');
    return updatedSettings;
  } catch (error) {
    console.error('Error updating settings:', error);
    throw new Error('Failed to update settings');
  }
}

export async function createDefaultSettings(updatedBy?: string): Promise<CompanySettings> {
  try {
    const now = Timestamp.now();
    const defaultSettings: CompanySettings = {
      ptoYearly: 20,
      ptoMonthly: 2,
      wfhYearly: 12,
      wfhMonthly: 1,
      optionalHolidaysYearly: 5,
      holidays: [],
      updatedAt: now.toDate().toISOString(),
      ...(updatedBy && { updatedBy }),
    };

    await setDoc(getDocRef(), defaultSettings);

    return defaultSettings;
  } catch (error) {
    console.error('Error creating default settings:', error);
    throw new Error('Failed to create default settings');
  }
}

export async function initializeSettings(updatedBy?: string): Promise<CompanySettings> {
  try {
    const existingSettings = await getSettings();
    if (existingSettings) {
      return existingSettings;
    }

    // Create default settings if none exist
    return await createDefaultSettings(updatedBy);
  } catch (error) {
    console.error('Error initializing settings:', error);
    throw new Error('Failed to initialize settings');
  }
}
