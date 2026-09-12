import React, { createContext, useContext, useState, useEffect } from 'react';
import { Settings, Theme } from '../types/workspace';
import { storageService } from '../services/storageService';

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => Promise<void>;
  isLoading: boolean;
}

const defaultSettings: Settings = {
  theme: 'light',
  confirmBeforeDeleting: true,
  checkForDuplicateTabs: true,
  hasCompletedOnboarding: false
};

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  updateSettings: async () => {},
  isLoading: true
});

export function useSettings() {
  return useContext(SettingsContext);
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial settings
  useEffect(() => {
    storageService.getSettings().then(loaded => {
      setSettings(loaded);
      setIsLoading(false);
    });
  }, []);

  // Sync settings when they change externally (e.g. from service worker, though not strictly needed yet)
  useEffect(() => {
    const handleStorageChange = (changes: any, areaName: string) => {
      if (areaName === 'local' && changes['tabsy_settings']) {
        setSettings(changes['tabsy_settings'].newValue || defaultSettings);
      }
    };
    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  }, []);

  const updateSettings = async (updates: Partial<Settings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    await storageService.saveSettings(newSettings);
  };

  // Apply Theme
  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = () => {
      if (settings.theme === 'dark') {
        root.classList.add('dark');
      } else if (settings.theme === 'light') {
        root.classList.remove('dark');
      } else {
        // System
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    };

    applyTheme();

    if (settings.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme();
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [settings.theme]);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, isLoading }}>
      {children}
    </SettingsContext.Provider>
  );
}
