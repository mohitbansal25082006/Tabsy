import { Tab, Workspace } from '../types/workspace';
import { storageService } from './storageService';
import { generateId } from '../utils/helpers';
import { tabService } from './tabService';

export const workspaceService = {
  async createWorkspace(name: string, icon: string, color: string, tabs: Tab[], category?: string, note?: string): Promise<Workspace> {
    const newWorkspace: Workspace = {
      id: generateId(),
      name,
      icon,
      color,
      category: category === '' ? undefined : category,
      note: note === '' ? undefined : note,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tabs: tabs.map(t => ({ ...t, createdAt: t.createdAt || Date.now() })),
      restoredCount: 0
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

  async updateWorkspaceMetadata(id: string, name: string, icon: string, color: string, category?: string, note?: string): Promise<void> {
    const workspace = await storageService.getWorkspace(id);
    if (workspace) {
      workspace.name = name;
      workspace.icon = icon;
      workspace.color = color;
      workspace.note = note;
      if (category !== undefined) {
        workspace.category = category === '' ? undefined : category;
      }
      workspace.updatedAt = Date.now();
      await storageService.saveWorkspace(workspace);
    }
  },

  async updateWorkspaceTabs(id: string, tabs: Tab[]): Promise<void> {
    const workspace = await storageService.getWorkspace(id);
    if (!workspace) throw new Error('Workspace not found');

    workspace.tabs = tabs;
    workspace.updatedAt = Date.now();
    
    await storageService.saveWorkspace(workspace);
  },

  async saveWorkspace(workspace: Workspace): Promise<void> {
    await storageService.saveWorkspace(workspace);
  },

  async deleteWorkspace(id: string): Promise<void> {
    await storageService.deleteWorkspace(id);
  },

  async getTrash(): Promise<import('../types/workspace').DeletedWorkspace[]> {
    return await storageService.getTrash();
  },

  async restoreFromTrash(id: string): Promise<void> {
    await storageService.restoreFromTrash(id);
  },

  async duplicateWorkspace(id: string): Promise<Workspace | null> {
    const workspace = await storageService.getWorkspace(id);
    if (!workspace) return null;

    const newWorkspace: Workspace = {
      ...workspace,
      id: generateId(),
      name: `${workspace.name} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      restoredCount: 0,
      lastRestoredAt: undefined
    };
    
    newWorkspace.tabs = newWorkspace.tabs.map(tab => ({
      ...tab,
      id: generateId(),
      createdAt: Date.now()
    }));

    await storageService.saveWorkspace(newWorkspace);
    return newWorkspace;
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
        const tabWithDate = { ...tab, createdAt: tab.createdAt || Date.now() };
        workspace.tabs.push(tabWithDate);
        workspace.updatedAt = Date.now();
        await storageService.saveWorkspace(workspace);
      }
    }
  },

  async restoreWorkspace(id: string, mode: 'add' | 'replace' = 'add'): Promise<{ opened: number, skipped: number, closed?: number }> {
    let opened = 0;
    let skipped = 0;
    let closed = 0;
    
    const workspace = await storageService.getWorkspace(id);
    const settings = await storageService.getSettings();
    
    if (workspace && workspace.tabs && workspace.tabs.length > 0) {
      const openTabsMap = await tabService.getOpenTabsMapInCurrentWindow();

      if (mode === 'replace') {
        // Find tabs that are currently open but not in the workspace
        const workspaceUrls = new Set(workspace.tabs.map(t => t.url ? tabService.normalizeUrl(t.url) : ''));
        const tabsToClose: number[] = [];
        
        for (const [url, tab] of openTabsMap.entries()) {
          if (tab.id && !workspaceUrls.has(url)) {
            tabsToClose.push(tab.id);
          }
        }

        if (tabsToClose.length > 0) {
          // If we are about to close all tabs, Chrome might close the window.
          // But tab opening happens next, so it's safer to open the new tabs first, THEN close the old ones.
          // However, for duplicate skipping to work smoothly, let's just flag them for closing later.
        }
      }
      
      const currentOpenTabsMap = settings.checkForDuplicateTabs || mode === 'replace'
        ? openTabsMap
        : new Map<string, chrome.tabs.Tab>();
      
      const workspaceUrls = new Set(workspace.tabs.map(t => t.url ? tabService.normalizeUrl(t.url) : ''));
      
      const groupsToCreate = new Map<string, { title: string, color: chrome.tabGroups.Color, tabIds: number[] }>();

      for (const tab of workspace.tabs) {
        if (!tab.url) continue;
        
        let targetTabId: number | undefined;
        const normalized = tabService.normalizeUrl(tab.url);
        
        if ((settings.checkForDuplicateTabs || mode === 'replace') && currentOpenTabsMap.has(normalized)) {
          skipped++;
          const existingTab = currentOpenTabsMap.get(normalized);
          if (existingTab && existingTab.id) {
            targetTabId = existingTab.id;
            if (existingTab.pinned !== tab.pinned) {
              await chrome.tabs.update(existingTab.id, { pinned: tab.pinned });
            }
          }
        } else {
          try {
            const newTab = await tabService.openTab(tab.url, tab.pinned);
            targetTabId = newTab.id;
            opened++;
            if (settings.checkForDuplicateTabs || mode === 'replace') {
              currentOpenTabsMap.set(normalized, {} as chrome.tabs.Tab);
            }
          } catch (error) {
            console.error('Failed to open tab:', error);
          }
        }

        if (targetTabId && tab.group) {
          const key = `${tab.group.title || ''}-${tab.group.color}`;
          if (!groupsToCreate.has(key)) {
            groupsToCreate.set(key, { title: tab.group.title || '', color: tab.group.color as chrome.tabGroups.Color, tabIds: [] });
          }
          groupsToCreate.get(key)!.tabIds.push(targetTabId);
        }
      }

      if (chrome.tabGroups) {
        for (const [key, groupData] of groupsToCreate.entries()) {
          try {
            if (groupData.tabIds.length > 0) {
              const groupId = await chrome.tabs.group({ tabIds: groupData.tabIds });
              await chrome.tabGroups.update(groupId, { title: groupData.title, color: groupData.color });
            }
          } catch (e) {
            console.error("Failed to create tab group:", e);
          }
        }
      }

      if (mode === 'replace') {
        const tabsToClose: number[] = [];
        for (const [url, tab] of openTabsMap.entries()) {
          if (tab.id && !workspaceUrls.has(url)) {
            tabsToClose.push(tab.id);
          }
        }
        if (tabsToClose.length > 0) {
          try {
            await chrome.tabs.remove(tabsToClose);
            closed = tabsToClose.length;
          } catch (e) {
            console.error('Failed to close tabs in replace mode', e);
          }
        }
      }
    }
    
    // Update analytics
    workspace.restoredCount = (workspace.restoredCount || 0) + 1;
    workspace.lastRestoredAt = Date.now();
    await storageService.saveWorkspace(workspace);

    return { opened, skipped, closed };
  },

  async exportWorkspaces(workspaceIds?: string[]): Promise<{ version: number; exportedAt: number; workspaces: import('../types/workspace').Workspace[]; settings: import('../types/workspace').Settings }> {
    let workspaces = await storageService.getAllWorkspaces();
    if (workspaceIds && workspaceIds.length > 0) {
      const idSet = new Set(workspaceIds);
      workspaces = workspaces.filter(ws => idSet.has(ws.id));
    }
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
        category: typeof ws.category === 'string' ? ws.category : undefined,
        note: typeof ws.note === 'string' ? ws.note : undefined,
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
          position: typeof tab.position === 'number' ? tab.position : 0,
          note: typeof tab.note === 'string' ? tab.note : undefined,
          group: tab.group && typeof tab.group.color === 'string' ? {
            color: tab.group.color as any,
            title: typeof tab.group.title === 'string' ? tab.group.title : undefined
          } : undefined
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
  },

  async getDuplicateTabsAcrossWorkspaces(): Promise<Map<string, { workspaces: import('../types/workspace').Workspace[], tab: Tab }>> {
    const workspaces = await storageService.getAllWorkspaces();
    const duplicates = new Map<string, { workspaces: import('../types/workspace').Workspace[], tab: Tab }>();
    const urlMap = new Map<string, { workspace: import('../types/workspace').Workspace, tab: Tab }[]>();

    for (const ws of workspaces) {
      for (const tab of ws.tabs) {
        if (!tab.url) continue;
        const normalized = tabService.normalizeUrl(tab.url);
        if (!urlMap.has(normalized)) {
          urlMap.set(normalized, []);
        }
        urlMap.get(normalized)!.push({ workspace: ws, tab });
      }
    }

    for (const [url, occurrences] of urlMap.entries()) {
      if (occurrences.length > 1) {
        // Extract unique workspaces
        const uniqueWorkspaces = new Map<string, import('../types/workspace').Workspace>();
        for (const occ of occurrences) {
          uniqueWorkspaces.set(occ.workspace.id, occ.workspace);
        }
        if (uniqueWorkspaces.size > 1) {
          duplicates.set(url, { workspaces: Array.from(uniqueWorkspaces.values()), tab: occurrences[0].tab });
        }
      }
    }

    return duplicates;
  }
};
