import { Tab } from '../types/workspace';
import { generateId } from '../utils/helpers';

export const tabService = {
  async getCurrentWindowTabs(): Promise<Tab[]> {
    try {
      const tabs = await chrome.tabs.query({ currentWindow: true });
      
      // Filter out extension internal URLs and chrome:// pages
      const filteredTabs = tabs.filter(tab => {
        const url = tab.url || '';
        if (url.startsWith('chrome://') || url.startsWith('chrome-extension://')) {
          return false;
        }
        return true;
      });

      return filteredTabs.map(tab => ({
        id: generateId(), // or tab.id.toString(), but generateId is safer for persistence
        title: tab.title || 'Untitled',
        url: tab.url || '',
        favicon: tab.favIconUrl,
        pinned: tab.pinned || false,
        position: tab.index
      }));
    } catch (error) {
      console.error('Failed to get current window tabs:', error);
      return [];
    }
  },

  async openTab(url: string): Promise<void> {
    try {
      await chrome.tabs.create({ url });
    } catch (error) {
      console.error(`Failed to open tab ${url}:`, error);
      throw error;
    }
  },

  async openMultipleTabs(urls: string[]): Promise<void> {
    for (const url of urls) {
      try {
        await chrome.tabs.create({ url });
      } catch (error) {
        console.warn(`Failed to open tab ${url}:`, error);
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

  async getAllOpenUrlsInCurrentWindow(): Promise<Set<string>> {
    try {
      const tabs = await chrome.tabs.query({ currentWindow: true });
      const urls = new Set<string>();
      for (const tab of tabs) {
        if (tab.url) {
          urls.add(this.normalizeUrl(tab.url));
        }
      }
      return urls;
    } catch (error) {
      console.error('Failed to get open URLs:', error);
      return new Set();
    }
  }
};
