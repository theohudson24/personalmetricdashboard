export const draftPrefix = "metric-os:draft:";

export function readDraft<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(`${draftPrefix}${key}`);
    return raw ? JSON.parse(raw) as T : null;
  } catch {
    return null;
  }
}

export function writeDraft(key: string, value: unknown) {
  try { localStorage.setItem(`${draftPrefix}${key}`, JSON.stringify(value)); } catch { /* Private browsing or storage quota: keep the in-memory form usable. */ }
}

export function clearDraft(key: string) {
  try { localStorage.removeItem(`${draftPrefix}${key}`); } catch { /* No persistent draft exists. */ }
}

export function clearAllDrafts() {
  try {
    for (let index = localStorage.length - 1; index >= 0; index -= 1) {
      const key = localStorage.key(index);
      if (key?.startsWith(draftPrefix)) localStorage.removeItem(key);
    }
  } catch { /* Storage is unavailable. */ }
}
