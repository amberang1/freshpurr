import { useEffect, useRef, useState } from 'react';

// Keep related records together; never replace corrupt or conflicting data silently.
export function useCareStorage<T>(key: string, initial: T, validate: (value: unknown) => T) {
  const [boot] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return { value: raw ? validate(JSON.parse(raw)) : initial, raw, error: '', blocked: false };
    } catch {
      return { value: initial, raw: null, error: 'Saved data could not be opened. Existing data has been preserved. Restore a valid backup in Profile to resume saving.', blocked: true };
    }
  });
  const [value, setValue] = useState<T>(boot.value);
  const [error, setError] = useState(boot.error);
  const [blocked, setBlocked] = useState(boot.blocked);
  const lastRaw = useRef(boot.raw);
  useEffect(() => {
    if (blocked) return;
    try {
      if (localStorage.getItem(key) !== lastRaw.current) {
        setBlocked(true); setError('Records changed in another tab. Download a backup of these changes, then reload before continuing.'); return;
      }
      const raw = JSON.stringify(value);
      localStorage.setItem(key, raw); lastRaw.current = raw; setError('');
    } catch { setError('Changes could not be saved on this device. Export a backup before closing this page.'); }
  }, [value, blocked]);
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key !== key && event.key !== null) return;
      try {
        const raw = localStorage.getItem(key);
        if (!raw) throw new Error('Records removed');
        const next = validate(JSON.parse(raw)); lastRaw.current = raw; setValue(next); setBlocked(false); setError('');
      } catch { setBlocked(true); setError('Saved records changed or were removed in another tab. Export a backup before reloading.'); }
    };
    window.addEventListener('storage', sync); return () => window.removeEventListener('storage', sync);
  }, [key]);
  const restore = (next: T) => {
    try {
      const checked = validate(next), raw = JSON.stringify(checked);
      localStorage.setItem(key, raw); lastRaw.current = raw;
      setBlocked(false); setError(''); setValue(checked);
    } catch { setError('Backup could not be saved. Your current records have been kept.'); }
  };
  return [value, setValue, error, restore] as const;
}
