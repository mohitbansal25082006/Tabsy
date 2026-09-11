import { Workspace, DeletedWorkspace } from '../types/workspace';

// Using a single storage key storing a Record<string, Workspace> for easy lookup by ID
const STORAGE_KEY = 'tabsy_workspaces';
const TRASH_KEY = 'tabsy_trash';

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
      const data = await chrome.storage.local.get([STORAGE_KEY, TRASH_KEY]);
      const workspacesRecord: Record<string, Workspace> = (data[STORAGE_KEY] as Record<string, Workspace>) || {};
      let trash: DeletedWorkspace[] = (data[TRASH_KEY] as DeletedWorkspace[]) || [];

      const workspaceToDelete = workspacesRecord[id];
      if (workspaceToDelete) {
        // Add to trash (limit to 10 most recent)
        const deletedItem: DeletedWorkspace = { ...workspaceToDelete, deletedAt: Date.now() };
        trash = [deletedItem, ...trash].slice(0, 10);
        
        delete workspacesRecord[id];
        await chrome.storage.local.set({ [STORAGE_KEY]: workspacesRecord, [TRASH_KEY]: trash });
      }
    } catch (error) {
      console.error(`Failed to delete workspace ${id}:`, error);
      throw error;
    }
  },

  async getTrash(): Promise<DeletedWorkspace[]> {
    try {
      const data = await chrome.storage.local.get(TRASH_KEY);
      return (data[TRASH_KEY] as DeletedWorkspace[]) || [];
    } catch (error) {
      console.error('Failed to get trash:', error);
      return [];
    }
  },

  async restoreFromTrash(id: string): Promise<void> {
    try {
      const data = await chrome.storage.local.get([STORAGE_KEY, TRASH_KEY]);
      const workspacesRecord: Record<string, Workspace> = (data[STORAGE_KEY] as Record<string, Workspace>) || {};
      let trash: DeletedWorkspace[] = (data[TRASH_KEY] as DeletedWorkspace[]) || [];

      const index = trash.findIndex(w => w.id === id);
      if (index !== -1) {
        const [restored] = trash.splice(index, 1);
        const { deletedAt, ...workspaceData } = restored;
        workspacesRecord[workspaceData.id] = workspaceData;
        await chrome.storage.local.set({ [STORAGE_KEY]: workspacesRecord, [TRASH_KEY]: trash });
      }
    } catch (error) {
      console.error(`Failed to restore from trash ${id}:`, error);
      throw error;
    }
  },

  async getSettings(): Promise<import('../types/workspace').Settings> {
    const defaultSettings: import('../types/workspace').Settings = {
      theme: 'light',
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
