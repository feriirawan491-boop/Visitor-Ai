'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from './ui/button';

export const themeStorageKey = 'visitor-ai.theme';

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const sync = () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
    const apply = (value: 'light' | 'dark') => {
      document.documentElement.dataset.theme = value;
      setTheme(value);
    };
    const onSystemChange = () => {
      try { if (localStorage.getItem(themeStorageKey)) return; } catch { /* System preference remains available without storage. */ }
      apply(media.matches ? 'dark' : 'light');
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key !== themeStorageKey && event.key !== null) return;
      apply(event.newValue === 'dark' || (!event.newValue && media.matches) ? 'dark' : 'light');
    };
    sync();
    setReady(true);
    media.addEventListener('change', onSystemChange);
    window.addEventListener('storage', onStorage);
    return () => {
      media.removeEventListener('change', onSystemChange);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    setTheme(next);
    try { localStorage.setItem(themeStorageKey, next); } catch { /* Theme still works for this session. */ }
  };

  return <Button className="theme-toggle" variant="ghost" size="icon" disabled={!ready} onClick={toggle} aria-label={theme === 'dark' ? 'Aktifkan light mode' : 'Aktifkan dark mode'} title={theme === 'dark' ? 'Light mode' : 'Dark mode'}>{theme === 'dark' ? <Sun size={18}/> : <Moon size={18}/>}</Button>;
}
