export interface TabGroupInfo {
  title?: string;
  color: string;
}

export interface Tab {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  pinned: boolean;
  position: number;
  note?: string;
  group?: TabGroupInfo;
  createdAt?: number; // V1.4 Analytics
}

export interface Workspace {
  id: string;
  name: string;
  icon: string;
  color: string;
  category?: string;
  note?: string;
  tabs: Tab[];
  createdAt: number;
  updatedAt: number;
  restoredCount?: number; // V1.4 Analytics
  lastRestoredAt?: number; // V1.4 Analytics
}

export interface DeletedWorkspace extends Workspace {
  deletedAt: number;
}

export type Theme = 'system' | 'light' | 'dark';

export interface Settings {
  theme: Theme;
  confirmBeforeDeleting: boolean;
  checkForDuplicateTabs: boolean;
  hasCompletedOnboarding?: boolean;
}
