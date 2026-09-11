export interface Tab {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  pinned: boolean;
  position: number;
}

export interface Workspace {
  id: string;
  name: string;
  icon: string;
  color: string;
  tabs: Tab[];
  createdAt: number;
  updatedAt: number;
}

export type Theme = 'system' | 'light' | 'dark';

export interface Settings {
  theme: Theme;
  confirmBeforeDeleting: boolean;
  checkForDuplicateTabs: boolean;
}
