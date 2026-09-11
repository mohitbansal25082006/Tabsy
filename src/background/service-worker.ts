import { workspaceService } from '../services/workspaceService';
import { generateId } from '../utils/helpers';
import { Tab } from '../types/workspace';

const CONTEXT_MENU_PARENT_ID = 'save-to-tabsy';
const CONTEXT_MENU_NEW_WORKSPACE_ID = 'tabsy-new-workspace';

async function rebuildContextMenu() {
  await chrome.contextMenus.removeAll();
  
  chrome.contextMenus.create({
    id: CONTEXT_MENU_PARENT_ID,
    title: 'Save page to Tabsy',
    contexts: ['page']
  });

  const workspaces = await workspaceService.getAllWorkspaces();
  workspaces.sort((a, b) => b.updatedAt - a.updatedAt);

  for (const ws of workspaces) {
    chrome.contextMenus.create({
      id: `workspace-${ws.id}`,
      parentId: CONTEXT_MENU_PARENT_ID,
      title: `${ws.icon} ${ws.name}`,
      contexts: ['page']
    });
  }

  // Separator
  if (workspaces.length > 0) {
    chrome.contextMenus.create({
      id: 'separator',
      parentId: CONTEXT_MENU_PARENT_ID,
      type: 'separator',
      contexts: ['page']
    });
  }

  // New Workspace option
  chrome.contextMenus.create({
    id: CONTEXT_MENU_NEW_WORKSPACE_ID,
    parentId: CONTEXT_MENU_PARENT_ID,
    title: '+ New Workspace',
    contexts: ['page']
  });
}

chrome.runtime.onInstalled.addListener(async () => {
  console.log("Tabsy installed. Foundation ready.");

  try {
    // Verify chrome.storage.local is accessible
    await chrome.storage.local.set({ _tabsy_init: true });
    await chrome.storage.local.get("_tabsy_init");
    await chrome.storage.local.remove("_tabsy_init");
  } catch (error) {
    console.error("Storage accessible error:", error);
  }

  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(err => {
    console.error("Error setting panel behavior:", err);
  });

  await rebuildContextMenu();
});

// Rebuild context menu when storage changes
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes['tabsy_workspaces']) {
    rebuildContextMenu();
  }
});

// Handle Context Menu Clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  try {
    if (!tab || !tab.url) return;

    const currentTabInfo: Tab = {
      id: generateId(),
      title: tab.title || 'Untitled',
      url: tab.url,
      favicon: tab.favIconUrl,
      pinned: tab.pinned || false,
      position: tab.index
    };

    if (info.menuItemId === CONTEXT_MENU_NEW_WORKSPACE_ID) {
      // Open side panel and trigger create-workspace with seed tab
      if (tab.windowId !== undefined) {
        await chrome.sidePanel.open({ windowId: tab.windowId });
      }
      
      // Delay slightly to give sidepanel time to mount if it wasn't open
      setTimeout(() => {
        chrome.runtime.sendMessage({ 
          type: 'TABSY_TRIGGER_CREATE_WORKSPACE',
          seedTab: currentTabInfo
        }).catch(() => {
          console.warn('Side panel not ready to receive message.');
        });
      }, 300);
    } else if (typeof info.menuItemId === 'string' && info.menuItemId.startsWith('workspace-')) {
      const workspaceId = info.menuItemId.replace('workspace-', '');
      await workspaceService.addTabToWorkspace(workspaceId, currentTabInfo);
    }
  } catch (error) {
    console.error('Error handling context menu click:', error);
  }
});

// Handle Keyboard Shortcuts
chrome.commands.onCommand.addListener(async (command) => {
  try {
    const currentWindow = await chrome.windows.getCurrent();
    const windowId = currentWindow.id;
    if (windowId === undefined) return;

    if (command === 'open-tabsy') {
      await chrome.sidePanel.open({ windowId });
    } else if (command === 'save-workspace') {
      await chrome.sidePanel.open({ windowId });
      
      setTimeout(() => {
        chrome.runtime.sendMessage({ 
          type: 'TABSY_TRIGGER_CREATE_WORKSPACE' 
        }).catch(() => {
          console.warn('Side panel not ready to receive message.');
        });
      }, 300);
    }
  } catch (error) {
    console.error('Error handling command:', error);
  }
});
