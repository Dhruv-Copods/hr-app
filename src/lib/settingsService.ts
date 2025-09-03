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

export class SettingsService {
  private static getDocRef() {
    return doc(db, COLLECTION_NAME, SETTINGS_DOC_ID);
  }

  static async getSettings(): Promise<CompanySettings | null> {
    try {
      const docSnap = await getDoc(this.getDocRef());

      if (docSnap.exists()) {
        const data = docSnap.data();
        // Ensure backward compatibility by adding holidays if missing
        const settings: CompanySettings = {
          ptoYearly: data.ptoYearly || 20,
          ptoMonthly: data.ptoMonthly || 2,
          wfhYearly: data.wfhYearly || 12,
          wfhMonthly: data.wfhMonthly || 1,
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

  static async updateSettings(settings: Partial<CompanySettings>, updatedBy?: string): Promise<CompanySettings> {
    try {
      const now = Timestamp.now();
      const docRef = this.getDocRef();

      // Get current settings first
      const currentSettings = await this.getSettings();
      const updatedSettings: CompanySettings = {
        ptoYearly: settings.ptoYearly ?? currentSettings?.ptoYearly ?? 20,
        ptoMonthly: settings.ptoMonthly ?? currentSettings?.ptoMonthly ?? 2,
        wfhYearly: settings.wfhYearly ?? currentSettings?.wfhYearly ?? 12,
        wfhMonthly: settings.wfhMonthly ?? currentSettings?.wfhMonthly ?? 1,
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

  static async createDefaultSettings(updatedBy?: string): Promise<CompanySettings> {
    try {
      const now = Timestamp.now();
      const defaultSettings: CompanySettings = {
        ptoYearly: 20,
        ptoMonthly: 2,
        wfhYearly: 12,
        wfhMonthly: 1,
        holidays: [],
        updatedAt: now.toDate().toISOString(),
        ...(updatedBy && { updatedBy }),
      };

      await setDoc(this.getDocRef(), defaultSettings);

      return defaultSettings;
    } catch (error) {
      console.error('Error creating default settings:', error);
      throw new Error('Failed to create default settings');
    }
  }

  static async initializeSettings(updatedBy?: string): Promise<CompanySettings> {
    try {
      const existingSettings = await this.getSettings();
      if (existingSettings) {
        return existingSettings;
      }

      // Create default settings if none exist
      return await this.createDefaultSettings(updatedBy);
    } catch (error) {
      console.error('Error initializing settings:', error);
      throw new Error('Failed to initialize settings');
    }
  }
}
