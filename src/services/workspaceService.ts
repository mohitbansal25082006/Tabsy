import { Tab, Workspace } from '../types/workspace';
import { storageService } from './storageService';
import { generateId } from '../utils/helpers';
import { tabService } from './tabService';

export const workspaceService = {
  async createWorkspace(name: string, icon: string, color: string, tabs: Tab[]): Promise<Workspace> {
    const newWorkspace: Workspace = {
      id: generateId(),
      name,
      icon,
      color,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tabs
    };
    await storageService.saveWorkspace(newWorkspace);
    return newWorkspace;
  },

  async getAllWorkspaces(): Promise<Workspace[]> {
    return await storageService.getAllWorkspaces();
  },

  async getWorkspaceById(id: string): Promise<Workspace | null> {
    return await storageService.getWorkspace(id);
  },

  async updateWorkspaceMetadata(id: string, name: string, icon: string, color: string): Promise<void> {
    const workspace = await storageService.getWorkspace(id);
    if (workspace) {
      workspace.name = name;
      workspace.icon = icon;
      workspace.color = color;
      workspace.updatedAt = Date.now();
      await storageService.saveWorkspace(workspace);
    }
  },

  async updateWorkspaceTabs(id: string, tabs: Tab[]): Promise<void> {
    const workspace = await storageService.getWorkspace(id);
    if (workspace) {
      workspace.tabs = tabs;
      workspace.updatedAt = Date.now();
      await storageService.saveWorkspace(workspace);
    }
  },

  async deleteWorkspace(id: string): Promise<void> {
    await storageService.deleteWorkspace(id);
  },

  async removeTabFromWorkspace(workspaceId: string, tabId: string): Promise<void> {
    const workspace = await storageService.getWorkspace(workspaceId);
    if (workspace) {
      workspace.tabs = workspace.tabs.filter(tab => tab.id !== tabId);
      workspace.updatedAt = Date.now();
      await storageService.saveWorkspace(workspace);
    }
  },

  async addTabToWorkspace(workspaceId: string, tab: Tab): Promise<void> {
    const workspace = await storageService.getWorkspace(workspaceId);
    if (workspace) {
      const normalizedNew = tabService.normalizeUrl(tab.url);
      const exists = workspace.tabs.some(t => tabService.normalizeUrl(t.url) === normalizedNew);
      if (!exists) {
        workspace.tabs.push(tab);
        workspace.updatedAt = Date.now();
        await storageService.saveWorkspace(workspace);
      }
    }
  },

  async restoreWorkspace(id: string): Promise<{ opened: number, skipped: number }> {
    let opened = 0;
    let skipped = 0;
    
    const workspace = await storageService.getWorkspace(id);
    const settings = await storageService.getSettings();
    
    if (workspace && workspace.tabs && workspace.tabs.length > 0) {
      const openUrls = settings.checkForDuplicateTabs 
        ? await tabService.getAllOpenUrlsInCurrentWindow()
        : new Set<string>();
      
      for (const tab of workspace.tabs) {
        if (!tab.url) continue;
        
        const normalized = tabService.normalizeUrl(tab.url);
        if (settings.checkForDuplicateTabs && openUrls.has(normalized)) {
          skipped++;
        } else {
          try {
            await tabService.openTab(tab.url);
            opened++;
            if (settings.checkForDuplicateTabs) {
              openUrls.add(normalized);
            }
          } catch (e) {
            console.error('Failed to open tab during restore:', tab.url, e);
          }
        }
      }
    }
    
    return { opened, skipped };
  },

  async exportWorkspaces(): Promise<{ version: number; exportedAt: number; workspaces: import('../types/workspace').Workspace[]; settings: import('../types/workspace').Settings }> {
    const workspaces = await storageService.getAllWorkspaces();
    const settings = await storageService.getSettings();
    return {
      version: 1,
      exportedAt: Date.now(),
      workspaces,
      settings
    };
  },

  async importWorkspaces(data: unknown): Promise<{ imported: number }> {
    if (!data || typeof data !== 'object') {
      throw new Error("Invalid backup file: not a JSON object.");
    }
    
    const obj = data as any;
    if (obj.version !== 1 || !Array.isArray(obj.workspaces)) {
      throw new Error("Invalid backup file format or version mismatch.");
    }
    
    if (obj.workspaces.length === 0) {
      return { imported: 0 };
    }
    
    const newWorkspaces: import('../types/workspace').Workspace[] = [];
    const now = Date.now();
    
    for (const ws of obj.workspaces) {
      if (!ws.name || typeof ws.name !== 'string' || !Array.isArray(ws.tabs)) {
        throw new Error("Invalid backup file: malformed workspace entry.");
      }
      
      const newWs: import('../types/workspace').Workspace = {
        id: crypto.randomUUID(),
        name: ws.name,
        icon: typeof ws.icon === 'string' ? ws.icon : '📁',
        color: typeof ws.color === 'string' ? ws.color : '#3B82F6',
        createdAt: now,
        updatedAt: now,
        tabs: []
      };
      
      for (const tab of ws.tabs) {
        if (!tab.url || typeof tab.url !== 'string') continue;
        newWs.tabs.push({
          id: crypto.randomUUID(),
          title: typeof tab.title === 'string' ? tab.title : 'Untitled',
          url: tab.url,
          favicon: typeof tab.favicon === 'string' ? tab.favicon : undefined,
          pinned: !!tab.pinned,
          position: typeof tab.position === 'number' ? tab.position : 0
        });
      }
      
      newWorkspaces.push(newWs);
    }
    
    // Save imported workspaces sequentially
    for (const ws of newWorkspaces) {
      await storageService.saveWorkspace(ws);
    }
    
    // Optionally we could import settings, but spec says "append workspaces".
    // Spec says: "Existing workspaces won't be affected." and implies appending them.
    
    return { imported: newWorkspaces.length };
  }
};
