"use client";

/**
 * Favorites persist in localStorage. CustomEvent syncs tabs/components; storage event syncs other windows.
 */
const FAVORITES_KEY = "mixmaster:favorites";
const FAVORITES_EVENT = "mixmaster:favorites-changed";

export function getFavoriteIds(): string[] {
  if (typeof window === "undefined") {
    return [];
  }
  const raw = window.localStorage.getItem(FAVORITES_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function setFavoriteIds(ids: string[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
  window.dispatchEvent(new CustomEvent(FAVORITES_EVENT));
}

export function subscribeFavorites(onChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const onStorage = (event: StorageEvent) => {
    if (event.key === FAVORITES_KEY) {
      onChange();
    }
  };
  const onCustom = () => onChange();

  window.addEventListener("storage", onStorage);
  window.addEventListener(FAVORITES_EVENT, onCustom);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(FAVORITES_EVENT, onCustom);
  };
}
