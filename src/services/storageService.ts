import { Workspace } from '../types/workspace';

// Using a single storage key storing a Record<string, Workspace> for easy lookup by ID
const STORAGE_KEY = 'tabsy_workspaces';

export const storageService = {
  async getAllWorkspaces(): Promise<Workspace[]> {
    try {
      const data = await chrome.storage.local.get(STORAGE_KEY);
      const workspacesRecord: Record<string, Workspace> = (data[STORAGE_KEY] as Record<string, Workspace>) || {};
      return Object.values(workspacesRecord);
    } catch (error) {
      console.error('Failed to get all workspaces:', error);
      return [];
    }
  },

  async getWorkspace(id: string): Promise<Workspace | null> {
    try {
      const data = await chrome.storage.local.get(STORAGE_KEY);
      const workspacesRecord: Record<string, Workspace> = (data[STORAGE_KEY] as Record<string, Workspace>) || {};
      return workspacesRecord[id] || null;
    } catch (error) {
      console.error(`Failed to get workspace ${id}:`, error);
      return null;
    }
  },

  async saveWorkspace(workspace: Workspace): Promise<void> {
    try {
      const data = await chrome.storage.local.get(STORAGE_KEY);
      const workspacesRecord: Record<string, Workspace> = (data[STORAGE_KEY] as Record<string, Workspace>) || {};
      workspacesRecord[workspace.id] = workspace;
      await chrome.storage.local.set({ [STORAGE_KEY]: workspacesRecord });
    } catch (error) {
      console.error(`Failed to save workspace ${workspace.id}:`, error);
      throw error;
    }
  },

  async deleteWorkspace(id: string): Promise<void> {
    try {
      const data = await chrome.storage.local.get(STORAGE_KEY);
      const workspacesRecord: Record<string, Workspace> = (data[STORAGE_KEY] as Record<string, Workspace>) || {};
      if (workspacesRecord[id]) {
        delete workspacesRecord[id];
        await chrome.storage.local.set({ [STORAGE_KEY]: workspacesRecord });
      }
    } catch (error) {
      console.error(`Failed to delete workspace ${id}:`, error);
      throw error;
    }
  },

  async getSettings(): Promise<import('../types/workspace').Settings> {
    const defaultSettings: import('../types/workspace').Settings = {
      theme: 'system',
      confirmBeforeDeleting: true,
      checkForDuplicateTabs: true
    };
    try {
      const data = await chrome.storage.local.get('tabsy_settings');
      if (data['tabsy_settings']) {
        return { ...defaultSettings, ...data['tabsy_settings'] };
      }
      return defaultSettings;
    } catch (error) {
      console.error('Failed to get settings:', error);
      return defaultSettings;
    }
  },

  async saveSettings(settings: import('../types/workspace').Settings): Promise<void> {
    try {
      await chrome.storage.local.set({ 'tabsy_settings': settings });
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  }
};
