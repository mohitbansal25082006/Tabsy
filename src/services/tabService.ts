import { Tab } from '../types/workspace';
import { generateId } from '../utils/helpers';

export const tabService = {
  async getCurrentWindowTabs(): Promise<Tab[]> {
    try {
      const tabs = await chrome.tabs.query({ currentWindow: true });
      const groups = new Map<number, chrome.tabGroups.TabGroup>();
      
      try {
        if (chrome.tabGroups) {
          const tabGroups = await chrome.tabGroups.query({ windowId: chrome.windows.WINDOW_ID_CURRENT });
          for (const g of tabGroups) {
            groups.set(g.id, g);
          }
        }
      } catch (e) {
        console.warn('Failed to query tab groups', e);
      }

      // Filter out extension internal URLs and chrome:// pages
      const filteredTabs = tabs.filter(tab => {
        const url = tab.url || '';
        if (url.startsWith('chrome://') || url.startsWith('chrome-extension://')) {
          return false;
        }
        return true;
      });

      return filteredTabs.map(tab => {
        let groupInfo = undefined;
        if (tab.groupId && tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) {
          const g = groups.get(tab.groupId);
          if (g) {
            groupInfo = {
              title: g.title,
              color: g.color as string
            };
          }
        }

        return {
          id: generateId(),
          title: tab.title || 'Untitled',
          url: tab.url || '',
          favicon: tab.favIconUrl,
          pinned: tab.pinned || false,
          position: tab.index,
          group: groupInfo
        };
      });
    } catch (error) {
      console.error('Failed to get current window tabs:', error);
      return [];
    }
  },

  async openTab(url: string, pinned: boolean = false): Promise<chrome.tabs.Tab> {
    try {
      return await chrome.tabs.create({ url, pinned });
    } catch (error) {
      console.error(`Failed to open tab ${url}:`, error);
      throw error;
    }
  },

  async openMultipleTabs(tabsToOpen: { url: string; pinned?: boolean }[]): Promise<void> {
    for (const tab of tabsToOpen) {
      try {
        await chrome.tabs.create({ url: tab.url, pinned: tab.pinned || false });
      } catch (error) {
        console.warn(`Failed to open tab ${tab.url}:`, error);
        // Continue with the rest of the batch
      }
    }
  },

  normalizeUrl(url: string): string {
    if (!url) return '';
    try {
      // Create a URL object to handle basic normalization
      const parsed = new URL(url);
      // Remove trailing slash from pathname if present (unless it's just '/')
      let pathname = parsed.pathname;
      if (pathname.length > 1 && pathname.endsWith('/')) {
        pathname = pathname.slice(0, -1);
      }
      // Return normalized string (ignoring hash for simple matching)
      return `${parsed.protocol}//${parsed.host}${pathname}${parsed.search}`;
    } catch {
      // If it fails to parse (e.g., malformed), just do basic string manipulation
      let normalized = url.trim();
      if (normalized.endsWith('/')) {
        normalized = normalized.slice(0, -1);
      }
      return normalized;
    }
  },

  async getOpenTabsMapInCurrentWindow(): Promise<Map<string, chrome.tabs.Tab>> {
    try {
      const tabs = await chrome.tabs.query({ currentWindow: true });
      const urlMap = new Map<string, chrome.tabs.Tab>();
      for (const tab of tabs) {
        if (tab.url) {
          urlMap.set(this.normalizeUrl(tab.url), tab);
        }
      }
      return urlMap;
    } catch (error) {
      console.error('Failed to get open URLs:', error);
      return new Map();
    }
  }
};
