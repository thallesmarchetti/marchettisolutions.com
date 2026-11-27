'use client';

import { useSyncExternalStore } from 'react';

const THEME_STORAGE_KEY = 'marchetti_theme';
type Theme = 'light' | 'dark';

const listeners = new Set<() => void>();

function notifyThemeChange() {
  listeners.forEach((listener) => listener());
}

function handleStorageChange(event: StorageEvent) {
  if (event.key === THEME_STORAGE_KEY || event.key === null) {
    notifyThemeChange();
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    window.addEventListener('storage', handleStorageChange);
  }

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      window.removeEventListener('storage', handleStorageChange);
    }
  };
}

function getSnapshot(): Theme {
  return window.localStorage.getItem(THEME_STORAGE_KEY) === 'dark' ? 'dark' : 'light';
}

function getServerSnapshot(): Theme {
  return 'light';
}

export function useThemePreference() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    notifyThemeChange();
  };

  return { isDarkMode: theme === 'dark', toggleTheme };
}
