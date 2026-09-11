export const syncService = {
  async getSyncMap(): Promise<Record<number, string>> {
    const data = await chrome.storage.local.get('tabsy_sync_map');
    return (data['tabsy_sync_map'] || {}) as Record<number, string>;
  },

  async setSyncMap(map: Record<number, string>): Promise<void> {
    await chrome.storage.local.set({ tabsy_sync_map: map });
  },

  async setSync(windowId: number, workspaceId: string): Promise<void> {
    const map = await this.getSyncMap();
    // A workspace can only be synced to one window at a time (optional, but logical)
    for (const wid of Object.keys(map)) {
      if (map[Number(wid)] === workspaceId) {
        delete map[Number(wid)];
      }
    }
    map[windowId] = workspaceId;
    await this.setSyncMap(map);
  },

  async getWorkspaceForWindow(windowId: number): Promise<string | null> {
    const map = await this.getSyncMap();
    return map[windowId] || null;
  },

  async stopSyncForWindow(windowId: number): Promise<void> {
    const map = await this.getSyncMap();
    if (map[windowId]) {
      delete map[windowId];
      await this.setSyncMap(map);
    }
  },

  async stopSyncForWorkspace(workspaceId: string): Promise<void> {
    const map = await this.getSyncMap();
    let changed = false;
    for (const wid of Object.keys(map)) {
      if (map[Number(wid)] === workspaceId) {
        delete map[Number(wid)];
        changed = true;
      }
    }
    if (changed) {
      await this.setSyncMap(map);
    }
  }
};
