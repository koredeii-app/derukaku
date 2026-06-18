export interface StorageAdapter {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
}

const PREFIX = "derukaku:";

class LocalStorageAdapter implements StorageAdapter {
  get<T>(key: string): T | null {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  set<T>(key: string, value: T): void {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  }

  remove(key: string): void {
    window.localStorage.removeItem(PREFIX + key);
  }
}

export const storage: StorageAdapter = new LocalStorageAdapter();
